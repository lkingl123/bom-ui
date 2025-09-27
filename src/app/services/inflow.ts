"use server"; // ensure this file is only used on the server

import type {
  ProductSummary,
  ProductDetail,
  ItemBom,
  BomComponentUI,
} from "../types";

// --- Environment variables (server-only) ---
const BASE_URL = process.env.INFLOW_BASE_URL!;
const COMPANY_ID = process.env.INFLOW_COMPANY_ID!;
const API_KEY = process.env.INFLOW_API_KEY!;

// --- UI-friendly types ---
export type ProductSummaryUI = ProductSummary & {
  totalQuantityOnHand?: number;
};

export type ProductDetailUI = ProductDetail & {
  totalQuantityOnHand?: number;
};

// --- In-memory cache ---
type CacheEntry<T> = { data: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

// --- Request log for rate limiting ---
const requestLog: number[] = [];
const RATE_LIMIT = 60; // 60 requests per minute

async function enforceRateLimit() {
  const now = Date.now();

  // Remove timestamps older than 60s
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

  // ✅ return cached if valid
  const cached = cache.get(key);
  if (!forceRefresh && cached && cached.expires > now) {
    return cached.data as T;
  }

  // ✅ enforce local rate limit
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

  // ✅ store in cache
  cache.set(key, { data, expires: now + TTL_MS });

  return data;
}

// =============================
// Products
// =============================

export async function getProductsPage(
  count: number = 50,
  after?: string,
  forceRefresh: boolean = false
): Promise<{ products: ProductDetailUI[]; lastId?: string }> {
  if (count > 100) count = 100;

  let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&sortBy=name&sortOrder=asc`;
  if (after) url += `&after=${after}`;

  const page = await inflowFetch<ProductDetail[]>(url, { forceRefresh });

  const mapped = page.map((p) => ({
    ...p,
    category: p.category ?? "Uncategorized",
    totalQuantityOnHand: p.totalQuantityOnHand
      ? Number(p.totalQuantityOnHand)
      : undefined,
  }));

  const lastId =
    mapped.length > 0 ? mapped[mapped.length - 1].productId : undefined;

  return { products: mapped, lastId };
}

export async function getProduct(
  productId: string,
  forceRefresh: boolean = false
): Promise<ProductDetailUI> {
  const product = await inflowFetch<ProductDetail>(
    `/products/${productId}?include=itemBoms,cost,defaultPrice,inventoryLines`,
    { forceRefresh }
  );

  return {
    ...product,
    category: product.category ?? "Uncategorized",
    totalQuantityOnHand: product.totalQuantityOnHand
      ? Number(product.totalQuantityOnHand)
      : undefined,
  };
}

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
  return product.itemBoms ?? [];
}

export async function calculateProductCost(
  productId: string,
  forceRefresh: boolean = false
): Promise<number> {
  const product = await getProduct(productId, forceRefresh);

  if (!product.itemBoms || product.itemBoms.length === 0) {
    return product.cost?.cost ? Number(product.cost.cost) : 0;
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
  if (!product.itemBoms || product.itemBoms.length === 0) return [];

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
        name: child.name,
        sku: child.sku,
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

export async function getPackagingProducts(
  count: number = 50,
  after?: string
) {
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
