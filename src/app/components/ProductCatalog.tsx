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

  // ✅ category filter
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const observerRef = useRef<HTMLDivElement | null>(null);

  // filtered by category
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.topLevelCategory === selectedCategory);

  // initial logging
  useEffect(() => {
    console.log("[ProductCatalog] Initial products loaded:", initialProducts);
    console.log(
      "[ProductCatalog] Distinct categories from initialProducts:",
      Array.from(new Set(initialProducts.map((p) => p.topLevelCategory)))
    );
  }, [initialProducts]);

  // update parent count
  useEffect(() => {
    onCountChange?.(filteredProducts.length);
    console.log(
      `[ProductCatalog] Active filter="${selectedCategory}", showing ${filteredProducts.length} products`
    );
  }, [filteredProducts.length, onCountChange, selectedCategory]);

  // 🔍 search effect
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
      // reset to initial
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

  // ♾️ infinite scroll
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
            console.log("[ProductCatalog] Infinite scroll results:", data);
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

      {/* Category filter buttons */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                console.log(`[ProductCatalog] Selected category="${cat}"`);
                setSelectedCategory(cat);
              }}
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

      {/* Product table */}
      <ProductTable products={filteredProducts} />

      {/* Loader sentinel */}
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
