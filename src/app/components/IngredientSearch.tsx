// src/app/components/IngredientSearch.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ProductSummary } from "../types";
import { inflowFetch } from "../services/inflow";
import { Search, X } from "lucide-react";

// --- Custom Hook for Search Logic (Optimized for Smart Filter) ---
const searchCache: Record<string, ProductSummary[]> = {};

function useIngredientSearch(query: string, debounceTime = 500) {
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  const buildSearchUrl = (searchQuery: string): string => {
    const params = new URLSearchParams({
      count: "20",
      sortBy: "name",
      sortOrder: "asc",
      include: "cost",
    });
    params.append("filter[smart]", searchQuery);
    return `/products?${params.toString()}`;
  };

  useEffect(() => {
    isMounted.current = true;
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      if (!isMounted.current) return;

      const cacheKey = query.toLowerCase();
      if (searchCache[cacheKey]) {
        if (isMounted.current) {
          setResults(searchCache[cacheKey]);
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
        }
        const url = buildSearchUrl(query);
        const data = await inflowFetch<ProductSummary[]>(url);

        // 🔍 Debug log to inspect the raw data
        console.log(
          `[useIngredientSearch] Results for "${query}":`,
          JSON.stringify(data, null, 2) // ✅ stringify with indentation
        );

        if (isMounted.current) {
          searchCache[cacheKey] = data;
          setResults(data);
        }
      } catch (err) {
        console.error(
          `[useIngredientSearch] ❌ Search failed for "${query}":`,
          err
        );
        if (isMounted.current) {
          setResults([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }, debounceTime);

    return () => {
      clearTimeout(handler);
      isMounted.current = false;
    };
  }, [query, debounceTime]);

  return { results, loading };
}

// --- IngredientSearch Component (UI with Dark Mode) ---

interface IngredientSearchProps {
  onSelect: (ingredient: ProductSummary) => void;
  onClose: () => void;
}

export default function IngredientSearch({
  onSelect,
  onClose,
}: IngredientSearchProps) {
  const [query, setQuery] = useState("");
  const { results, loading } = useIngredientSearch(query);

  const handleSelect = (r: ProductSummary) => {
    // 🔍 Log the selected product object
    console.log("[IngredientSearch] Selected ingredient:", r);
    onSelect(r);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-700">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Search Component
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Input Area */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-600 pl-10 pr-4 py-2 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-[#0e5439] focus:border-[#0e5439] transition"
              placeholder="Search by name, SKU, or barcode..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center">
              <span className="animate-spin mr-2">🔄</span> Searching...
            </p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              No ingredients found. Try a different query.
            </p>
          )}
        </div>

        {/* Results List */}
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {results.map((r) => (
            <li
              key={r.productId}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center transition-colors"
              onClick={() => handleSelect(r)}
            >
              <div className="flex flex-col">
                <span className="text-gray-800 dark:text-gray-100 font-medium">
                  {r.name}
                </span>
                {r.sku && (
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    SKU: {r.sku}
                  </span>
                )}
              </div>
              <span className="text-[#0e5439] font-mono text-sm flex-shrink-0">
                {r.cost?.cost
                  ? `$${parseFloat(r.cost.cost).toFixed(2)} / kg`
                  : "— Cost N/A"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
