// src/app/components/PackagingSearch.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ProductSummaryUI } from "../services/inflow"; 
import { inflowFetch } from "../services/inflow";
import { Search, X } from "lucide-react"; 

// --- Custom Hook for Search Logic (Optimized for Smart Filter) ---
const searchCache: Record<string, ProductSummaryUI[]> = {};

function usePackagingSearch(query: string, debounceTime = 500) {
  const [results, setResults] = useState<ProductSummaryUI[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  const buildSearchUrl = (searchQuery: string): string => {
    const params = new URLSearchParams({
      count: "30",
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
        const data = await inflowFetch<ProductSummaryUI[]>(url);

        if (isMounted.current) {
          searchCache[cacheKey] = data;
          setResults(data);
        }
      } catch (err) {
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

// --- PackagingSearch Component (Finalized UI) ---

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
    onSelect(r);
    onClose();
  };

  return (
    // Backdrop. Added transition-opacity for a soft fade-in/out
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      {/* Modal Container. Added transition-transform for a subtle scale/movement */}
      <div 
        className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] transition-transform duration-300 ease-out"
        // Optional: Use a state variable or a key to force re-render and transition on mount
      >
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          {/* ✅ Fixed Title */}
          <h3 className="text-xl font-semibold text-gray-800">Search Packaging</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Search Input Area */}
        <div className="p-4 border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-base focus:ring-1 focus:ring-[#0e5439] focus:border-[#0e5439] transition"
              // ✅ Fixed Placeholder
              placeholder="Search by name, SKU, or category..."
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
                  ? `$${parseFloat(r.cost.cost).toFixed(2)}`
                  : "— Cost N/A"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}