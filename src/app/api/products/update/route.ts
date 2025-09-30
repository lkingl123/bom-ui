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
      timestamp: fresh.timestamp,
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
    await inflowFetch("/products", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    // 4. Re-fetch the updated product to get the NEW timestamp ✅
    const updatedFresh = await getProduct(productId);

    return NextResponse.json(updatedFresh);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[products/update] ❌", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[products/update] ❌ Unknown error", err);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
