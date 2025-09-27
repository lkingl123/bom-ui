// src/app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { getProductsPage, getExpandedBom } from "../../../services/inflow";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const after = searchParams.get("after") ?? undefined;
  const productId = searchParams.get("productId");

  try {
    // Case 1: BOM fetch
    if (productId) {
      const bom = await getExpandedBom(productId);
      return NextResponse.json({ components: bom });
    }

    // Case 2: Product search (paged)
    const { products, lastId } = await getProductsPage(80, after);

    // ✅ Apply name filter on top of already-filtered list
    const filtered = q
      ? products.filter((p) =>
          p.name.toLowerCase().includes(q.toLowerCase())
        )
      : products;

    console.log(
      `[products/search] Returning ${filtered.length} products (after=${after ?? "none"})`
    );

    return NextResponse.json({
      products: filtered,
      lastId,
      cached: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
