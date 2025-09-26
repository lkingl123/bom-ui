// src/app/services/inflow.ts
import type {
  ProductSummary,
  ProductDetail,
  ItemBom,
  BomComponentUI,
} from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_INFLOW_BASE_URL!;
const COMPANY_ID = process.env.NEXT_PUBLIC_INFLOW_COMPANY_ID!;
const API_KEY = process.env.NEXT_PUBLIC_INFLOW_API_KEY!;

// --- UI-friendly types ---
export type ProductSummaryUI = ProductSummary & {
  totalQuantityOnHand?: number;
};

export type ProductDetailUI = ProductDetail & {
  totalQuantityOnHand?: number;
};

// =============================
// Rate Limiting Queue
// =============================
const queue: (() => void)[] = [];
let isProcessing = false;

// process one request per 1100ms (safe under 60/minute)
const RATE_LIMIT_MS = 1100;

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  const next = queue.shift();
  if (next) next();

  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, RATE_LIMIT_MS);
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
    processQueue();
  });
}

// =============================
// Shared fetch helper
// =============================
export async function inflowFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return enqueue(async () => {
    const headers = new Headers({
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json;version=2025-06-24",
      ...(options.headers || {}),
    });

    if (options.method && options.method !== "GET" && options.method !== "HEAD") {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${BASE_URL}/${COMPANY_ID}${endpoint}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `inFlow API error: ${res.status} ${res.statusText} – ${text}`
      );
    }

    return res.json() as Promise<T>;
  });
}

// =============================
// Product Cache
// =============================
const productCache = new Map<string, ProductDetailUI>();

// =============================
// Products
// =============================

export async function getProductsPage(
  count: number = 50,
  after?: string
): Promise<{ products: ProductSummaryUI[]; lastId?: string }> {
  let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&sortBy=name&sortOrder=asc`;
  if (after) url += `&after=${after}`;

  const page = await inflowFetch<ProductSummary[]>(url);

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

export async function getProduct(productId: string): Promise<ProductDetailUI> {
  if (productCache.has(productId)) {
    return productCache.get(productId)!;
  }

  const product = await inflowFetch<ProductDetail>(
    `/products/${productId}?include=itemBoms,cost,defaultPrice,inventoryLines`
  );

  const uiProduct: ProductDetailUI = {
    ...product,
    category: product.category ?? "Uncategorized",
    totalQuantityOnHand: product.totalQuantityOnHand
      ? Number(product.totalQuantityOnHand)
      : undefined,
  };

  productCache.set(productId, uiProduct);
  return uiProduct;
}

export async function getProductInventorySummary(productId: string) {
  return inflowFetch<{
    productId: string;
    locationId?: string;
    quantityOnHand?: number;
    quantityAvailable?: number;
    quantityReserved?: number;
  }>(`/products/${productId}/summary`);
}

// --- Get raw BOM entries straight from API ---
export async function getProductBomsRaw(productId: string): Promise<ItemBom[]> {
  const product = await getProduct(productId);
  return product.itemBoms ?? [];
}

// --- Get expanded BOM entries with child product details ---
export async function getExpandedBom(
  productId: string
): Promise<BomComponentUI[]> {
  const product = await getProduct(productId);
  if (!product.itemBoms || product.itemBoms.length === 0) return [];

  const components = await Promise.all(
    product.itemBoms.map(async (bom) => {
      const child = await getProduct(bom.childProductId);
      return {
        itemBomId: bom.itemBomId,
        childProductId: bom.childProductId,
        name: child.name,
        sku: child.sku,
        cost: child.cost?.cost ? Number(child.cost.cost) : 0,
        quantity: bom.quantity?.uomQuantity
          ? Number(bom.quantity.uomQuantity)
          : 0,
        uom: bom.quantity?.uom ?? "",
      };
    })
  );

  return components;
}
