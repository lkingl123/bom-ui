// src/app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { inflowFetch, getCategories } from "../../../services/inflow";
import type { ProductDetail, Category } from "../../../types";
import { resolveTopLevelCategory } from "../../../utils/categories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const after = searchParams.get("after") ?? undefined;
  const count = 50;

  try {
    // 🔍 Case: smart search
    if (q.trim() !== "") {
      let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&filter[smart]=${encodeURIComponent(
        q
      )}`;
      if (after) url += `&after=${after}`;

      const [page, categories] = await Promise.all([
        inflowFetch<ProductDetail[]>(url),
        getCategories(),
      ]);

      const mapped = page.map((p) => {
        const cat = categories.find((c: Category) => c.categoryId === p.categoryId);
        const top = resolveTopLevelCategory(cat, categories);
        return { ...p, topLevelCategory: top };
      });

      return NextResponse.json({
        products: mapped,
        lastId: page.length > 0 ? page[page.length - 1].productId : undefined,
      });
    }

    // fallback: no query → normal paged list
    let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&sortBy=name&sortOrder=asc`;
    if (after) url += `&after=${after}`;

    const [page, categories] = await Promise.all([
      inflowFetch<ProductDetail[]>(url),
      getCategories(),
    ]);

    const mapped = page.map((p) => {
      const cat = categories.find((c: Category) => c.categoryId === p.categoryId);
      const top = resolveTopLevelCategory(cat, categories);
      return { ...p, topLevelCategory: top };
    });

    return NextResponse.json({
      products: mapped,
      lastId: page.length > 0 ? page[page.length - 1].productId : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
