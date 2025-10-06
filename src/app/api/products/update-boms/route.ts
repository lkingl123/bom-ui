// src/app/api/products/update-boms/route.ts
import { NextResponse } from "next/server";
import { inflowFetch, getProduct } from "../../../services/inflow";
import type { ItemBom, ProductDetail } from "../../../types";

export async function POST(req: Request) {
  console.log("🚀 [POST /api/products/update-boms] Request received");

  try {
    const rawBody = await req.text();
    console.log("📥 Raw request body:", rawBody);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Failed to parse JSON body:", err);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { productId, itemBoms } = parsed as {
      productId: string;
      itemBoms: ItemBom[];
    };

    if (!productId || !itemBoms) {
      console.error("❌ Missing productId or itemBoms in request");
      return NextResponse.json(
        { error: "Missing productId or itemBoms" },
        { status: 400 }
      );
    }

    console.log(`📦 Updating BOMs for Product ID: ${productId}`);
    console.log(`🧩 Received ${itemBoms.length} components`);
    itemBoms.forEach((b, idx) => {
      console.log(
        `   #${idx + 1} → childProductId=${b.childProductId}, qty=${b.quantity.uomQuantity}`
      );
    });

    console.log("🔄 Fetching latest product snapshot from inFlow (forceRefresh=true)...");
    const fresh = await getProduct(productId, true);

    if (!fresh) {
      console.warn("⚠️ Product not found:", productId);
      return NextResponse.json(
        { error: `Product ${productId} not found` },
        { status: 404 }
      );
    }

    console.log(
      "✅ Product fetched:",
      JSON.stringify(
        {
          productId: fresh.productId,
          timestamp: fresh.timestamp,
          currentBomCount: fresh.itemBoms?.length ?? 0,
        },
        null,
        2
      )
    );

    // 🧠 Build minimal payload for PUT
    const payload = {
      productId: fresh.productId,
      timestamp: fresh.timestamp,
      itemBoms: itemBoms.map((b) => ({
        ...b,
        quantity: {
          standardQuantity: Number(b.quantity.standardQuantity).toFixed(4),
          uomQuantity: Number(b.quantity.uomQuantity).toFixed(4),
          uom: b.quantity.uom || "kg",
          serialNumbers: [],
        },
      })),
    };

    console.log("🧱 Built BOM payload →", JSON.stringify(payload, null, 2));

    let putResponse: ProductDetail | null = null;
    try {
      console.log("📡 Sending PUT request to inFlow /products...");
      putResponse = await inflowFetch<ProductDetail>("/products", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      console.log("✅ Initial PUT success — new timestamp:", putResponse?.timestamp);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message || "";
        console.error("💥 PUT request failed:", msg);

        if (msg.includes("entity_modified") || msg.includes("409")) {
          console.warn("⚠️ Conflict detected (409/entity_modified). Retrying...");
          const latest = await getProduct(productId, true);
          console.log("🕓 Latest product timestamp:", latest?.timestamp);

          if (!latest) throw new Error("Failed to re-fetch product for retry.");

          const retryPayload = { ...payload, timestamp: latest.timestamp };
          console.log("🔁 Retrying PUT:", JSON.stringify(retryPayload, null, 2));

          putResponse = await inflowFetch<ProductDetail>("/products", {
            method: "PUT",
            body: JSON.stringify(retryPayload),
          });
          console.log("✅ Retry PUT success — new timestamp:", putResponse?.timestamp);
        } else {
          console.error("❌ Non-retryable PUT failure:", err);
          throw err;
        }
      } else {
        console.error("💥 PUT failed with non-Error object:", err);
        throw new Error("Unknown PUT failure");
      }
    }

    console.log("🎉 [SUCCESS] BOMs updated successfully for:", productId);
    console.log(
      "📤 Response snapshot:",
      JSON.stringify(
        {
          newTimestamp: putResponse?.timestamp,
          itemBoms: putResponse?.itemBoms?.length,
        },
        null,
        2
      )
    );

    return NextResponse.json({ success: true, updated: putResponse });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("💥 [products/update-boms] Fatal Error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("💥 [products/update-boms] Unknown Fatal Error:", err);
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
