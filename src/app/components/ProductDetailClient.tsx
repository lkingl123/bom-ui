"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IngredientTable from "./IngredientTable";
import ExportPDFButton from "./ExportPDFButton";
import type { Product } from "../types";

export default function ProductDetailClient({ name }: { name: string }) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `https://bom-api.fly.dev/products/${encodeURIComponent(name)}`
      );
      if (res.ok) {
        setProduct(await res.json());
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

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {product.product_name}
        </h1>
        <p className="text-gray-600 mb-6">
          SKU: {product.sku || "-"} | Barcode: {product.barcode || "-"}
        </p>

        <IngredientTable components={product.components} />
        <div className="mt-6 flex justify-end">
          <ExportPDFButton product={product} />
        </div>
      </section>
    </main>
  );
}
