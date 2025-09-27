"use client";

import type { ProductSummaryUI } from "../services/inflow";
import { useState, useEffect, useRef } from "react";
import ProductTable from "./ProductTable";
import LoadingSpinner from "./LoadingSpinner"; // ✅ import spinner

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

  // 🔄 update parent count
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.topLevelCategory === selectedCategory);

  useEffect(() => {
    onCountChange?.(filteredProducts.length);
  }, [filteredProducts.length, onCountChange]);

  // 🔍 search effect
  useEffect(() => {
    if (query.trim() === "") {
      setProducts(initialProducts);
      setLastId(
        initialProducts.length > 0
          ? initialProducts[initialProducts.length - 1].productId
          : undefined
      );
      setHasMore(true);
      return;
    }

    let cancelled = false;
    async function fetchSearch() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}`
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

    fetchSearch();
    return () => {
      cancelled = true;
    };
  }, [query, initialProducts]);

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
                query
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
  }, [query, lastId, hasMore, loading]);

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
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
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
          <LoadingSpinner /> // ✅ show your spinner
        ) : hasMore ? (
          <span className="text-gray-500"></span>
        ) : (
          <span className="text-gray-500">No more results</span>
        )}
      </div>
    </div>
  );
}
