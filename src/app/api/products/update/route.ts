// src/app/api/products/update/route.ts
import { NextResponse } from "next/server";
import { inflowFetch, getProduct } from "../../../services/inflow";

export async function POST(req: Request) {
  console.log("🚀 [POST /api/products/update] Request received");

  try {
    const { productId, updates } = await req.json();
    console.log("📥 Parsed request body:", { productId, updates });

    // 🧠 Always bypass cache to ensure we get the freshest timestamp
    console.log("🔄 Fetching latest product data (forceRefresh=true) for ID:", productId);
    const fresh = await getProduct(productId, true);
    console.log("✅ Fresh product fetched:", fresh ? fresh.productId : "Not found");

    if (!fresh) {
      console.warn("⚠️ Product not found:", productId);
      return NextResponse.json(
        { error: `Product ${productId} not found` },
        { status: 404 }
      );
    }

    // 1️⃣ Build update payload using the latest data
    const payload = {
      productId: fresh.productId,
      timestamp: fresh.timestamp, // critical for optimistic concurrency
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

    // 2️⃣ Attempt PUT with retry logic
    let putResponse: any;
    try {
      console.log("📡 Sending PUT request to /products...");
      putResponse = await inflowFetch("/products", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      console.log("✅ PUT success, new timestamp:", putResponse?.timestamp);
    } catch (err: any) {
      const errMsg = err?.message || "";
      if (errMsg.includes("entity_modified") || errMsg.includes("409")) {
        console.warn("⚠️ Conflict detected — waiting briefly before retry...");
        await new Promise((res) => setTimeout(res, 300));

        // ⚙️ Re-fetch the product with cache bypass
        const latest = await getProduct(productId, true);
        console.log("🕓 Latest fetched timestamp (after conflict):", latest?.timestamp);

        if (!latest) throw new Error("Failed to refetch product for retry.");

        const retryPayload = { ...payload, timestamp: latest.timestamp };
        console.log("🔁 Retrying PUT with new timestamp:", latest.timestamp);

        putResponse = await inflowFetch("/products", {
          method: "PUT",
          body: JSON.stringify(retryPayload),
        });
        console.log("✅ Retry success, new timestamp:", putResponse?.timestamp);
      } else {
        throw err;
      }
    }

    // 3️⃣ Use the PUT response directly — no immediate re-fetch needed
    console.log("🎉 Returning updated product directly from PUT response");
    return NextResponse.json(putResponse);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("💥 [products/update] Error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("💥 [products/update] Unknown error:", err);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
