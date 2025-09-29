// src/app/components/PackagingSearch.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
// Assuming ProductSummaryUI is defined in "../services/inflow" or a types file
import type { ProductSummaryUI } from "../services/inflow"; 
import { inflowFetch } from "../services/inflow";
import { Search, X } from "lucide-react"; 

// --- Custom Hook for Search Logic (Optimized for Smart Filter) ---
const searchCache: Record<string, ProductSummaryUI[]> = {};

function usePackagingSearch(query: string, debounceTime = 500) {
  const [results, setResults] = useState<ProductSummaryUI[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  // Builds the API URL using the filter[smart] parameter.
  const buildSearchUrl = (searchQuery: string): string => {
    const params = new URLSearchParams({
      count: "30",
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
        console.log(`[usePackagingSearch] ✅ Cache hit for "${cacheKey}"`);
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
        console.log(`[usePackagingSearch] 🔄 Fetching from inFlow API: ${url}`);

        const data = await inflowFetch<ProductSummaryUI[]>(url);

        console.log(`[usePackagingSearch] ✅ API returned ${data.length} results.`);

        // Update cache and state only if still mounted
        if (isMounted.current) {
          searchCache[cacheKey] = data;
          setResults(data);
        }
      } catch (err) {
        console.error(`[usePackagingSearch] ❌ Search failed for "${query}":`, err);
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

// --- PackagingSearch Component (UI Refactored) ---

interface PackagingSearchProps {
  onSelect: (packaging: ProductSummaryUI) => void;
  onClose: () => void;
}

export default function PackagingSearch({
  onSelect,
  onClose,
}: PackagingSearchProps) {
  const [query, setQuery] = useState("");
  const { results, loading } = usePackagingSearch(query);

  const handleSelect = (r: ProductSummaryUI) => {
    console.log(`[PackagingSearch] 🟢 Selected packaging:`, r);
    onSelect(r);
    onClose(); // Close after selection
  };

  return (
    // Modal Backdrop and positioning
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Search Packaging Component</h3>
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
              placeholder="Search by name, SKU, barcode..."
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
              No packaging found. Try a different query.
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
                  ? `$${parseFloat(r.cost.cost).toFixed(2)}` // Cost per unit (no /kg)
                  : "— Cost N/A"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}