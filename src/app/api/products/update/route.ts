// src/app/api/products/update/route.ts
import { NextResponse } from "next/server";
import { inflowFetch, getProduct } from "../../../services/inflow";

export async function POST(req: Request) {
  try {
    const { productId, updates } = await req.json();

    // 1. Get fresh product to grab latest timestamp
    const fresh = await getProduct(productId);

    if (!fresh) {
      return NextResponse.json(
        { error: `Product ${productId} not found` },
        { status: 404 }
      );
    }

    // 2. Build minimal payload with fresh timestamp + edits
    const payload = {
      productId: fresh.productId,
      timestamp: fresh.timestamp, // ✅ required
      name: updates.name ?? fresh.name,
      description: updates.description ?? fresh.description,
      remarks: updates.remarks ?? fresh.remarks,
      sku: updates.sku ?? fresh.sku,
      customFields: {
        ...fresh.customFields,
        custom1: updates.inci ?? fresh.customFields?.custom1,
        custom8: updates.account ?? fresh.customFields?.custom8,
      },
    };

    // 3. PUT update to inFlow
    const updated = await inflowFetch("/products", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[products/update] ❌", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
