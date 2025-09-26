// src/app/components/IngredientSearch.tsx
"use client";

import React, { useState, useEffect } from "react";
import type { ProductSummary } from "../types";
import { inflowFetch } from "../services/inflow";

// Simple in-memory cache for search queries
const searchCache: Record<string, ProductSummary[]> = {};

interface IngredientSearchProps {
  onSelect: (ingredient: ProductSummary) => void;
  onClose: () => void;
}

export default function IngredientSearch({
  onSelect,
  onClose,
}: IngredientSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce input (avoid hitting API every keystroke)
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      console.log(`[IngredientSearch] Searching for query: "${query}"`);

      if (searchCache[query]) {
        console.log(
          `[IngredientSearch] ✅ Cache hit for "${query}"`,
          searchCache[query]
        );
        setResults(searchCache[query]);
        return;
      }

      try {
        setLoading(true);
        console.log(`[IngredientSearch] 🔄 Fetching from inFlow API...`);

        const page = await inflowFetch<ProductSummary[]>(
          `/products?count=20&sortBy=name&sortOrder=asc&filter[name]=${encodeURIComponent(
            query
          )}`
        );

        console.log(`[IngredientSearch] ✅ API returned`, page);

        searchCache[query] = page;
        setResults(page);
      } catch (err) {
        console.error(`[IngredientSearch] ❌ Search failed:`, err);
      } finally {
        setLoading(false);
      }
    }, 500); // ⏳ 500ms debounce

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Search Ingredients</h3>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <p className="text-sm text-gray-500">Searching...</p>}
        <ul className="max-h-64 overflow-y-auto">
          {results.map((r) => (
            <li
              key={r.productId}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                console.log(`[IngredientSearch] 🟢 Selected ingredient`, r);
                onSelect(r);
              }}
            >
              {r.name} ({r.sku})
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
