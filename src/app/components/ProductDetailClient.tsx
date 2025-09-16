"use client";

import { useState, useEffect } from "react";
import ExportPDFButton from "./ExportPDFButton";
import IngredientTable from "./IngredientTable";
import Link from "next/link";

export default function ProductDetailClient({ decodedName }: { decodedName: string }) {
  const [product, setProduct] = useState<any>(null);
  const [packagingCost, setPackagingCost] = useState(1.5);
  const [laborCost, setLaborCost] = useState(2.5);

  useEffect(() => {
    fetch(`https://bom-api.fly.dev/products/${encodeURIComponent(decodedName)}`)
      .then((res) => res.json())
      .then(setProduct)
      .catch((err) => console.error("❌ Fetch failed:", err));
  }, [decodedName]);

  if (!product) return <p className="p-6">Loading...</p>;

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        {/* Back button */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] hover:scale-105 active:scale-95 cursor-pointer transition"
          >
            ← Back to Catalog
          </Link>
        </div>

        {/* Title + meta */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {product.product_name}
        </h1>
        <p className="text-gray-600 mb-6">
          SKU: {product.sku || "-"} | Barcode: {product.barcode || "-"}
        </p>

        {/* Ingredient Table */}
        <IngredientTable
          components={product.components}
          totalCost={product.calculated_cost}
          packagingCost={packagingCost}
          setPackagingCost={setPackagingCost}
          laborCost={laborCost}
          setLaborCost={setLaborCost}
        />

        {/* Export PDF */}
        <div className="mt-6">
          <ExportPDFButton
            product={product}
            packagingCost={packagingCost}
            laborCost={laborCost}
          />
        </div>
      </section>
    </main>
  );
}
