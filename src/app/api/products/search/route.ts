// src/app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { inflowFetch, getCategories } from "../../../services/inflow";
import type { ProductDetail, Category } from "../../../types";
import { resolveTopLevelCategory } from "../../../utils/categories";

export async function GET(req: Request) {
  console.log("➡️ [GET /api/products/search] called");

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const after = searchParams.get("after") ?? undefined;
  const forceRefresh = searchParams.get("forceRefresh") === "true"; // 👈 NEW FLAG
  const count = 50;

  console.log("🔍 Query params:", { q, after, forceRefresh });

  try {
    // Case: smart search
    if (q.trim() !== "") {
      console.log("🧠 Smart search mode");
      let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&filter[smart]=${encodeURIComponent(
        q
      )}`;
      if (after) url += `&after=${after}`;
      console.log("🌐 URL:", url);

      const [page, categories] = await Promise.all([
        inflowFetch<ProductDetail[]>(url, { forceRefresh }), // 👈 PASS FLAG HERE
        getCategories(forceRefresh),
      ]);

      console.log("✅ Data fetched:", {
        products: page.length,
        categories: categories.length,
      });

      const mapped = page.map((p, i) => {
        const cat = categories.find((c) => c.categoryId === p.categoryId);
        const top = resolveTopLevelCategory(cat, categories);
        console.log(`📦 Product ${i}:`, {
          name: p.name,
          category: cat?.name,
          topLevelCategory: top ?? "None",
        });
        return { ...p, topLevelCategory: top };
      });

      console.log("✅ Returning smart search result");
      return NextResponse.json({
        products: mapped,
        lastId: page.length > 0 ? page[page.length - 1].productId : undefined,
      });
    }

    // Fallback: normal paged list
    console.log("📄 Normal list mode");
    let url = `/products?count=${count}&include=cost,defaultPrice,vendorItems,inventoryLines&sortBy=name&sortOrder=asc`;
    if (after) url += `&after=${after}`;
    console.log("🌐 URL:", url);

    const [page, categories] = await Promise.all([
      inflowFetch<ProductDetail[]>(url, { forceRefresh }), // 👈 PASS FLAG HERE TOO
      getCategories(forceRefresh),
    ]);

    console.log("✅ Data fetched:", {
      products: page.length,
      categories: categories.length,
    });

    const mapped = page.map((p, i) => {
      const cat = categories.find((c) => c.categoryId === p.categoryId);
      const top = resolveTopLevelCategory(cat, categories);
      console.log(`📦 Product ${i}:`, {
        name: p.name,
        category: cat?.name,
        topLevelCategory: top ?? "None",
      });
      return { ...p, topLevelCategory: top };
    });

    console.log("✅ Returning normal list result");
    return NextResponse.json({
      products: mapped,
      lastId: page.length > 0 ? page[page.length - 1].productId : undefined,
    });
  } catch (err) {
    console.error("💥 Error in /api/products/search:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
