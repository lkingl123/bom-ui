"use client";

import { useState } from "react";
import ProductTable from "../components/ProductTable";

export default function ProductsPageWrapper({ products }: { products: any[] }) {
  const [query, setQuery] = useState("");

  // Safe guard in case products is undefined
  const safeProducts = Array.isArray(products) ? products : [];

  const filtered = safeProducts.filter((p) =>
    p.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Product Catalog
        </h2>
        <span className="text-sm text-gray-500">
          {filtered.length} / {safeProducts.length} products
        </span>
      </div>

      {/* 🔍 Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full md:w-1/3 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0e5439] focus:outline-none"
        />
      </div>

      <ProductTable products={filtered} />
    </div>
  );
}
