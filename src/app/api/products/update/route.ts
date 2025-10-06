// src/app/api/products/update/route.ts
import { NextResponse } from "next/server";
import { inflowFetch, getProduct } from "../../../services/inflow";

export async function POST(req: Request) {
  console.log("🚀 [POST /api/products/update] Request received");

  try {
    const { productId, updates } = await req.json();
    console.log("📥 Parsed request body:", { productId, updates });

    // 1. Get fresh product to grab latest timestamp
    console.log("🔄 Fetching latest product data for ID:", productId);
    const fresh = await getProduct(productId);
    console.log("✅ Fresh product fetched:", fresh ? fresh.productId : "Not found");

    if (!fresh) {
      console.warn("⚠️ Product not found:", productId);
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

    console.log("🧱 Built update payload:", payload);

    // 3. PUT update to inFlow
    console.log("📡 Sending PUT request to /products...");
    const putResponse = await inflowFetch("/products", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    console.log("✅ PUT request completed successfully:", putResponse);

    // 4. Re-fetch the updated product to get the NEW timestamp ✅
    console.log("🔁 Re-fetching updated product...");
    const updatedFresh = await getProduct(productId);
    console.log("✅ Updated product re-fetched:", updatedFresh ? updatedFresh.productId : "None");

    console.log("🎉 Returning updated product in response");
    return NextResponse.json(updatedFresh);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("💥 [products/update] Error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("💥 [products/update] Unknown error:", err);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
