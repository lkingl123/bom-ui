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

// --- Shared fetch helper ---
export async function inflowFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
}

// =============================
// Products
// =============================

/**
 * Fetch a single page of products.
 * @param pageNumber The page number to fetch.
 * @param pageSize Number of products per page (max 100).
 */

export async function getProductsPage(
  count: number = 50,
  after?: string
): Promise<{ products: ProductSummaryUI[]; lastId?: string }> {
  // Build query params — no filters
  let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&sortBy=name&sortOrder=asc`;
  if (after) {
    url += `&after=${after}`;
  }

  const page = await inflowFetch<ProductSummary[]>(url);

  // Map results into UI-friendly shape
  const mapped = page.map((p) => ({
    ...p,
    category: p.category ?? "Uncategorized",
    totalQuantityOnHand: p.totalQuantityOnHand
      ? Number(p.totalQuantityOnHand)
      : undefined,
  }));

  // The last productId in this batch will be used for pagination
  const lastId =
    mapped.length > 0 ? mapped[mapped.length - 1].productId : undefined;

  return { products: mapped, lastId };
}

export async function getProduct(productId: string): Promise<ProductDetailUI> {
  const product = await inflowFetch<ProductDetail>(
    `/products/${productId}?include=itemBoms,cost,defaultPrice,inventoryLines`
  );

  return {
    ...product,
    category: product.category ?? "Uncategorized",
    totalQuantityOnHand: product.totalQuantityOnHand
      ? Number(product.totalQuantityOnHand)
      : undefined,
  };
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

// --- Recursively calculate rolled-up cost of a product ---
export async function calculateProductCost(productId: string): Promise<number> {
  const product = await getProduct(productId);

  // Base case: no BOM → just return its own cost
  if (!product.itemBoms || product.itemBoms.length === 0) {
    return product.cost?.cost ? Number(product.cost.cost) : 0;
  }

  // Recursive case: roll up children
  let total = 0;
  for (const bom of product.itemBoms) {
    const qty = bom.quantity?.uomQuantity ? Number(bom.quantity.uomQuantity) : 0;
    const childCost = await calculateProductCost(bom.childProductId);
    total += childCost * qty;
  }
  return total;
}

// --- Get expanded BOM entries with rolled-up child costs ---
export async function getExpandedBom(productId: string): Promise<BomComponentUI[]> {
  const product = await getProduct(productId);
  if (!product.itemBoms || product.itemBoms.length === 0) return [];

  const components = await Promise.all(
    product.itemBoms.map(async (bom) => {
      const child = await getProduct(bom.childProductId);
      const rolledCost = await calculateProductCost(bom.childProductId); // 🔑 recursive roll-up
      return {
        itemBomId: bom.itemBomId,
        childProductId: bom.childProductId,
        name: child.name,
        sku: child.sku,
        cost: rolledCost,
        quantity: bom.quantity?.uomQuantity ? Number(bom.quantity.uomQuantity) : 0,
        uom: bom.quantity?.uom ?? "",
      };
    })
  );

  return components;
}
