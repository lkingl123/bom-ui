import { NextResponse } from "next/server";
import { inflowFetch, getExpandedBom } from "../../../services/inflow";
import type { ProductSummary } from "@/app/types";

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

    // Case 2: Product search
    let url = `/products?count=80&sortBy=name&sortOrder=asc`;
    if (q) url += `&filter[name]=${encodeURIComponent(q)}`;
    if (after) url += `&after=${after}`;

    // ✅ inflowFetch handles caching
    const page = await inflowFetch<ProductSummary[]>(url);

    return NextResponse.json({
      products: page,
      lastId: page.length > 0 ? page[page.length - 1].productId : undefined,
      cached: true,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
