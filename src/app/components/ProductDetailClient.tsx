"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import IngredientTable from "./IngredientTable";
import ExportPDFButton from "./ExportPDFButton";
import type { Component, ComponentEditable, ProductDetail } from "../types";

export default function ProductDetailClient({
  name,
}: {
  name: string;
}): React.ReactElement {
  const [product, setProduct] = useState<ProductDetail | null>(null);

  const [editableComponents, setEditableComponents] = useState<ComponentEditable[]>([]);
  const [originalComponents, setOriginalComponents] = useState<ComponentEditable[]>([]);
  const [packagingCost, setPackagingCost] = useState<number>(100.5);
  const [laborCost, setLaborCost] = useState<number>(200.5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://bom-api.fly.dev/products/${encodeURIComponent(name)}`
        );

        if (!res.ok) {
          console.error("Failed to fetch product detail:", res.status);
          return;
        }

        const data: ProductDetail = await res.json();
        console.log("Product detail response:", data);

        // ✅ derive total quantity
        const totalQuantity = data.components.reduce(
          (sum: number, c: Component) => sum + (c.quantity || 0),
          0
        );

        // ✅ normalize with percent
        const normalized: ComponentEditable[] = data.components.map((c: Component) => ({
          ...c,
          percent:
            totalQuantity > 0
              ? parseFloat(((c.quantity / totalQuantity) * 100).toFixed(2))
              : 0,
        }));

        setProduct(data);
        setEditableComponents(normalized);
        setOriginalComponents(normalized);
      } catch (err) {
        console.error("Error fetching product detail:", err);
      }
    };

    fetchData();
  }, [name]);

  if (!product) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] hover:scale-105 active:scale-95 cursor-pointer transition"
          >
            ← Back to Catalog
          </Link>
        </div>

        {/* Editable product name */}
        <h1 className="mb-4">
          <input
            type="text"
            value={product.product_name}
            onChange={(e) =>
              setProduct({ ...product, product_name: e.target.value })
            }
            className="border rounded px-3 py-2 w-full text-3xl font-bold text-gray-900"
          />
        </h1>

        <p className="text-gray-600 mb-6">
          SKU: {product.sku || "-"} | Barcode: {product.barcode || "-"} | Category:{" "}
          {product.category || "-"}
        </p>

        {/* Ingredient Table */}
        <IngredientTable
          components={editableComponents}
          setComponents={setEditableComponents}
          packagingCost={packagingCost}
          setPackagingCost={setPackagingCost}
          laborCost={laborCost}
          setLaborCost={setLaborCost}
          originalComponents={originalComponents}
        />

        {/* Export PDF */}
        <div className="mt-6 flex justify-end">
          <ExportPDFButton
            product={product}
            components={editableComponents}
            packagingCost={packagingCost}
            laborCost={laborCost}
          />
        </div>
      </section>
    </main>
  );
}
