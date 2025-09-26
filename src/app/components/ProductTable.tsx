"use client";

import Link from "next/link";
import type { ProductSummary } from "../types";

export default function ProductTable({ products }: { products: ProductSummary[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const quantity = p.totalQuantityOnHand
          ? Number(p.totalQuantityOnHand).toLocaleString()
          : "N/A";

        return (
          <Link
            key={p.productId}
            href={`/products/${encodeURIComponent(p.productId)}`}
            className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
          >
            {/* Card Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-[#0e5439] transition">
                {p.name}
              </h2>
              <p className="text-sm text-gray-500">
                {p.category || "Uncategorized"}
              </p>
            </div>

            <hr className="my-4 border-gray-200" />

            {/* Card Body */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">SKU</span>
                <span className="font-semibold text-[#0e5439]">
                  {p.sku || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium text-gray-800">{quantity}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6">
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#eaf4ef] text-[#0e5439]">
                View Details →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
