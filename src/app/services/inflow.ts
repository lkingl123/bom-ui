"use server"; // ensure this file is only used on the server

import type {
  ProductSummary,
  ProductDetail,
  ItemBom,
  BomComponentUI,
  Category,
} from "../types";

// --- Environment variables (server-only) ---
const BASE_URL = process.env.INFLOW_BASE_URL!;
const COMPANY_ID = process.env.INFLOW_COMPANY_ID!;
const API_KEY = process.env.INFLOW_API_KEY!;

// --- UI-friendly types ---
export type ProductSummaryUI = ProductSummary & {
  totalQuantityOnHand?: number;
  topLevelCategory?: string;
};

export type ProductDetailUI = ProductDetail & {
  totalQuantityOnHand?: number;
  topLevelCategory?: string;
  category?: string;
};

// --- In-memory cache ---
type CacheEntry<T> = { data: T; expires: number };
const cache: Map<string, CacheEntry<unknown>> = new Map();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

// --- Request log for rate limiting ---
const requestLog: number[] = [];
const RATE_LIMIT = 60; // 60 requests per minute

async function enforceRateLimit() {
  const now = Date.now();
  while (requestLog.length && now - requestLog[0] > 60000) {
    requestLog.shift();
  }
  if (requestLog.length >= RATE_LIMIT) {
    const wait = 60000 - (now - requestLog[0]) + 50;
    await new Promise((r) => setTimeout(r, wait));
  }
  requestLog.push(Date.now());
}

// --- Shared fetch helper (with caching + rate limiting) ---
export async function inflowFetch<T>(
  endpoint: string,
  options: RequestInit & { forceRefresh?: boolean } = {}
): Promise<T> {
  const { forceRefresh, ...fetchOptions } = options;
  const key = `${endpoint}:${JSON.stringify(fetchOptions)}`;
  const now = Date.now();

  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (!forceRefresh && cached && cached.expires > now) {
    return cached.data;
  }

  await enforceRateLimit();

  const headers = new Headers({
    Authorization: `Bearer ${API_KEY}`,
    Accept: "application/json;version=2025-06-24",
    ...(fetchOptions.headers || {}),
  });

  if (
    fetchOptions.method &&
    fetchOptions.method !== "GET" &&
    fetchOptions.method !== "HEAD"
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}/${COMPANY_ID}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `inFlow API error: ${res.status} ${res.statusText} – ${text}`
    );
  }

  const data = (await res.json()) as T;
  cache.set(key, { data, expires: now + TTL_MS });
  return data;
}

// =============================
// Categories
// =============================
let categoryCache: Category[] | null = null;

export async function getCategories(forceRefresh = false): Promise<Category[]> {
  if (!forceRefresh && categoryCache) return categoryCache;

  const all: Category[] = [];
  let after: string | undefined = undefined;

  while (true) {
    let url = `/categories?count=80&sortBy=name&sortOrder=asc`;
    if (after) url += `&after=${after}`;

    const page = await inflowFetch<Category[]>(url, { forceRefresh });
    all.push(...page);

    if (page.length < 80) break;
    after = page[page.length - 1].categoryId;
  }

  console.log(`[getCategories] ✅ Loaded ${all.length} categories`);
  categoryCache = all;
  return all;
}

function resolveTopLevelCategory(
  cat: Category | undefined,
  all: Category[]
): string {
  const TOP_LEVELS = [
    "Finished Goods",
    "Bulk",
    "Ingredients",
    "Materials",
    "Account",
  ];

  let current = cat;
  while (current && current.parentCategoryId) {
    current = all.find(
      (c: Category) => c.categoryId === current!.parentCategoryId
    );
  }

  if (current) {
    const name = current.name.trim();
    if (TOP_LEVELS.includes(name)) return name;
  }

  return "Uncategorized"; // catch-all
}

// =============================
// Products
// =============================
export async function getProductsPage(
  count: number = 50,
  after?: string,
  forceRefresh: boolean = false
): Promise<{ products: ProductSummaryUI[]; lastId?: string }> {
  if (count > 100) count = 100;

  let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&sortBy=name&sortOrder=asc`;
  if (after) url += `&after=${after}`;

  const [page, categories] = await Promise.all([
    inflowFetch<ProductDetail[]>(url, { forceRefresh }),
    getCategories(forceRefresh),
  ]);

  console.log(
    `[getProductsPage] 🔄 Raw page (count=${page.length}, after=${after})`
  );

  const mapped: ProductSummaryUI[] = page.map((p) => {
    const cat = categories.find((c) => c.categoryId === p.categoryId);
    const top = resolveTopLevelCategory(cat, categories);

    return {
      ...p,
      topLevelCategory: top,
      totalQuantityOnHand: p.totalQuantityOnHand
        ? Number(p.totalQuantityOnHand)
        : undefined,
    };
  });

  // ✅ Exclude Uncategorized + Default
  const filtered = mapped.filter(
    (p) =>
      p.topLevelCategory !== "Uncategorized" &&
      p.topLevelCategory !== "Default"
  );

  // 🔎 Dump full product data as JSON
  console.log(
    `[getProductsPage] ✅ Returning products (after=${after})\n${JSON.stringify(
      filtered,
      null,
      2
    )}`
  );

  const lastId =
    filtered.length > 0 ? filtered[filtered.length - 1].productId : undefined;

  return { products: filtered, lastId };
}

export async function getProduct(
  productId: string,
  forceRefresh: boolean = false
): Promise<ProductDetailUI | null> {
  const [product, categories] = await Promise.all([
    inflowFetch<ProductDetail>(
      `/products/${productId}?include=itemBoms,cost,defaultPrice,inventoryLines`,
      { forceRefresh }
    ),
    getCategories(forceRefresh),
  ]);

  const cat = categories.find((c) => c.categoryId === product.categoryId);
  const top = resolveTopLevelCategory(cat, categories);

  if (top === "Uncategorized" || top === "Default") {
    // ✅ Don’t return this product at all
    return null;
  }

  return {
    ...product,
    category: cat?.name ?? "Uncategorized",
    topLevelCategory: top,
    totalQuantityOnHand: product.totalQuantityOnHand
      ? Number(product.totalQuantityOnHand)
      : undefined,
  };
}

// =============================
// Other helpers stay unchanged
// =============================
export async function getProductInventorySummary(
  productId: string,
  forceRefresh: boolean = false
) {
  return inflowFetch<{
    productId: string;
    locationId?: string;
    quantityOnHand?: number;
    quantityAvailable?: number;
    quantityReserved?: number;
  }>(`/products/${productId}/summary`, { forceRefresh });
}

export async function getProductBomsRaw(
  productId: string,
  forceRefresh: boolean = false
): Promise<ItemBom[]> {
  const product = await getProduct(productId, forceRefresh);
  return product?.itemBoms ?? [];
}

export async function calculateProductCost(
  productId: string,
  forceRefresh: boolean = false
): Promise<number> {
  const product = await getProduct(productId, forceRefresh);
  if (!product || !product.itemBoms || product.itemBoms.length === 0) {
    return product?.cost?.cost ? Number(product.cost.cost) : 0;
  }

  let total = 0;
  for (const bom of product.itemBoms) {
    const qty = bom.quantity?.uomQuantity
      ? Number(bom.quantity.uomQuantity)
      : 0;
    const childCost = await calculateProductCost(
      bom.childProductId,
      forceRefresh
    );
    total += childCost * qty;
  }
  return total;
}

export async function getExpandedBom(
  productId: string,
  forceRefresh: boolean = false
): Promise<BomComponentUI[]> {
  const product = await getProduct(productId, forceRefresh);
  if (!product || !product.itemBoms || product.itemBoms.length === 0) return [];

  const components = await Promise.all(
    product.itemBoms.map(async (bom) => {
      const child = await getProduct(bom.childProductId, forceRefresh);
      const rolledCost = await calculateProductCost(
        bom.childProductId,
        forceRefresh
      );
      return {
        itemBomId: bom.itemBomId,
        childProductId: bom.childProductId,
        name: child?.name ?? "",
        sku: child?.sku,
        cost: rolledCost,
        quantity: bom.quantity?.uomQuantity
          ? Number(bom.quantity.uomQuantity)
          : 0,
        uom: bom.quantity?.uom ?? "",
      };
    })
  );

  return components;
}

export async function getPackagingProducts(count: number = 50, after?: string) {
  const { products, lastId } = await getProductsPage(count, after);

  const packagingProducts = products.filter((p) => {
    const cat = p.category?.toString().toLowerCase();
    return (
      cat?.includes("packaging") ||
      cat?.includes("bottle") ||
      cat?.includes("jar") ||
      cat?.includes("lid") ||
      cat?.includes("box")
    );
  });

  return { products: packagingProducts, lastId };
}
