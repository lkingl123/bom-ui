// src/app/components/PackagingSearch.tsx
"use client";

import React, { useState, useEffect } from "react";
import type { ProductSummary } from "../types";
import { inflowFetch } from "../services/inflow";

// Simple in-memory cache for search queries
const searchCache: Record<string, ProductSummary[]> = {};

interface PackagingSearchProps {
  onSelect: (packaging: ProductSummary) => void;
  onClose: () => void;
}

export default function PackagingSearch({
  onSelect,
  onClose,
}: PackagingSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to check if a product looks like "packaging"
  function isPackagingCategory(cat?: string | { name?: string }): boolean {
  if (!cat) return false;

  // Normalize: handle object vs string
  const c =
    typeof cat === "string"
      ? cat.toLowerCase()
      : (cat.name ?? "").toLowerCase();

  return (
    c.includes("packaging") ||
    c.includes("bottle") ||
    c.includes("jar") ||
    c.includes("lid") ||
    c.includes("cap") ||
    c.includes("carton") ||
    c.includes("box")
  );
}

  // Debounce search
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      console.log(`[PackagingSearch] Searching for query: "${query}"`);

      if (searchCache[query]) {
        console.log(
          `[PackagingSearch] ✅ Cache hit for "${query}"`,
          searchCache[query]
        );
        setResults(searchCache[query]);
        return;
      }

      try {
        setLoading(true);
        console.log(`[PackagingSearch] 🔄 Fetching from inFlow API...`);

        const page = await inflowFetch<ProductSummary[]>(
          `/products?count=30&sortBy=name&sortOrder=asc&include=cost,category&filter[name]=${encodeURIComponent(
            query
          )}`
        );

        // Filter down to packaging only
        const filtered = page.filter((p) => isPackagingCategory(p.category));

        console.log(
          `[PackagingSearch] ✅ API returned ${page.length}, ${filtered.length} matched packaging`
        );

        searchCache[query] = filtered;
        setResults(filtered);
      } catch (err) {
        console.error(`[PackagingSearch] ❌ Search failed:`, err);
      } finally {
        setLoading(false);
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Search Packaging</h3>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <p className="text-sm text-gray-500">Searching...</p>}
        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200">
          {results.map((r) => (
            <li
              key={r.productId}
              className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              onClick={() => {
                console.log(`[PackagingSearch] 🟢 Selected packaging`, r);
                onSelect(r);
              }}
            >
              <span>
                {r.name} {r.sku ? `(${r.sku})` : ""}
              </span>
              <span className="text-gray-500 text-sm">
                {r.cost?.cost
                  ? `$${parseFloat(r.cost.cost).toFixed(2)}`
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
