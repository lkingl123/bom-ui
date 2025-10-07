"use client";

import type { ProductSummaryUI } from "../services/inflow";
import { useState, useEffect, useRef } from "react";
import ProductTable from "./ProductTable";
import LoadingSpinner from "./LoadingSpinner";

// --- debounce hook ---
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function ProductCatalog({
  initialProducts,
  categories,
  onCountChange,
}: {
  initialProducts: ProductSummaryUI[];
  categories?: string[];
  onCountChange?: (count: number) => void;
}) {
  const [products, setProducts] = useState<ProductSummaryUI[]>(initialProducts);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [lastId, setLastId] = useState<string | undefined>(
    initialProducts.length > 0
      ? initialProducts[initialProducts.length - 1].productId
      : undefined
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ✅ category + active status filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // --- Filtered products (category + active toggle) ---
  const filteredProducts = products.filter((p) => {
    const categoryMatch =
      selectedCategory === "All" ||
      p.topLevelCategory === selectedCategory;

    const activeMatch = showActiveOnly ? p.isActive : true;

    return categoryMatch && activeMatch;
  });

  // --- Initial logging ---
  useEffect(() => {
    console.log("[ProductCatalog] Initial products loaded:", initialProducts);
  }, [initialProducts]);

  // --- Update count in parent ---
  useEffect(() => {
    onCountChange?.(filteredProducts.length);
  }, [filteredProducts.length, onCountChange, selectedCategory]);

  // --- Search effect ---
  useEffect(() => {
    let cancelled = false;

    async function fetchSearch() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products ?? []);
          setLastId(data.lastId);
          setHasMore(Boolean(data.lastId));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (debouncedQuery.trim() === "") {
      setProducts(initialProducts);
      setLastId(
        initialProducts.length > 0
          ? initialProducts[initialProducts.length - 1].productId
          : undefined
      );
      setHasMore(true);
      return;
    }

    fetchSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, initialProducts]);

  // --- Infinite scroll ---
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          try {
            const res = await fetch(
              `/api/products/search?q=${encodeURIComponent(
                debouncedQuery
              )}&after=${lastId ?? ""}`
            );
            const data = await res.json();
            setProducts((prev) => [...prev, ...(data.products ?? [])]);
            setLastId(data.lastId);
            setHasMore(Boolean(data.lastId));
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold: 1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [debouncedQuery, lastId, hasMore, loading]);

  return (
    <div>
      {/* 🔍 Search bar + Active toggle */}
      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0e5439]"
        />

        {/* ✅ Active Only Toggle */}
        <div className="flex items-center gap-2 ml-4">
          <label htmlFor="activeToggle" className="text-sm text-gray-700 font-bold">
            Active Products Only
          </label>
          <button
            id="activeToggle"
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              showActiveOnly ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                showActiveOnly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 🏷️ Category filter */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-[#0e5439] text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 📦 Product table */}
      <ProductTable products={filteredProducts} />

      {/* 🌀 Loader sentinel */}
      <div ref={observerRef} className="h-16 flex justify-center items-center">
        {loading ? (
          <LoadingSpinner />
        ) : hasMore ? (
          <span className="text-gray-500"></span>
        ) : (
          <span className="text-gray-500">No more results</span>
        )}
      </div>
    </div>
  );
}
