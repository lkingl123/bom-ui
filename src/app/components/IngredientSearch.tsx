// src/app/components/IngredientSearch.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
// Assuming ProductSummary is the correct type
import type { ProductSummary } from "../types"; 
import { inflowFetch } from "../services/inflow";
import { Search, X } from "lucide-react"; // Import icons for a cleaner look

// --- Custom Hook for Search Logic (Optimized for Smart Filter) ---
const searchCache: Record<string, ProductSummary[]> = {};

function useIngredientSearch(query: string, debounceTime = 500) {
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  // Builds the API URL using the filter[smart] parameter.
  const buildSearchUrl = (searchQuery: string): string => {
    const params = new URLSearchParams({
      count: "20",
      sortBy: "name",
      sortOrder: "asc",
      include: "cost",
    });
    // Relying on filter[smart] for comprehensive search across relevant fields.
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
      
      // 1. Cache Check
      if (searchCache[cacheKey]) {
        console.log(`[useIngredientSearch] ✅ Cache hit for "${cacheKey}"`);
        if (isMounted.current) {
          setResults(searchCache[cacheKey]);
          setLoading(false);
        }
        return;
      }

      // 2. API Fetch
      try {
        if (isMounted.current) {
          setLoading(true);
        }
        const url = buildSearchUrl(query);
        console.log(`[useIngredientSearch] 🔄 Fetching from inFlow API: ${url}`);

        const data = await inflowFetch<ProductSummary[]>(url);

        console.log(`[useIngredientSearch] ✅ API returned ${data.length} results.`);

        // Update cache and state only if still mounted
        if (isMounted.current) {
          searchCache[cacheKey] = data;
          setResults(data);
        }
      } catch (err) {
        console.error(`[useIngredientSearch] ❌ Search failed for "${query}":`, err);
        if (isMounted.current) {
          setResults([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }, debounceTime);

    // Cleanup function
    return () => {
      clearTimeout(handler);
      isMounted.current = false;
    };
  }, [query, debounceTime]);

  return { results, loading };
}

// --- IngredientSearch Component (UI Refactored) ---

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
    console.log(`[IngredientSearch] 🟢 Selected ingredient:`, r);
    onSelect(r);
    onClose(); // Close after selection
  };

  return (
    // Modal Backdrop and positioning
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Search Ingredients</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Search Input Area */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-base focus:ring-1 focus:ring-[#0e5439] focus:border-[#0e5439] transition"
              placeholder="Search by name, SKU, or barcode..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          {/* Status Messages */}
          {loading && (
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <span className="animate-spin mr-2">🔄</span> Searching...
            </p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No ingredients found. Try a different query.
            </p>
          )}
        </div>
        
        {/* Results List */}
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {results.map((r) => (
            <li
              key={r.productId}
              className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors"
              onClick={() => handleSelect(r)}
            >
              <div className="flex flex-col">
                <span className="text-gray-800 font-medium">
                  {r.name}
                </span>
                {r.sku && <span className="text-gray-500 text-xs">SKU: {r.sku}</span>}
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