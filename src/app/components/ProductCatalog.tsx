"use client";

import { useState } from "react";
import ProductTable from "./ProductTable";

type Product = {
  name: string;
  sku: string;
  cost: number;
  components: number;
  category: string;
  remarks?: string;
};

export default function ProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  // Filter products by name, sku, or category
  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5439]"
        />
      </div>

      {/* Product grid */}
      <ProductTable products={filtered} />
    </div>
  );
}
