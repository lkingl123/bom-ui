"use client";

import { useState, useEffect, useRef } from "react";
import ProductTable from "./ProductTable";
import type { ProductSummary } from "../types";

export default function ProductCatalog({
  initialProducts,
}: {
  initialProducts: ProductSummary[];
}) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductSummary[]>(initialProducts);
  const [lastId, setLastId] = useState<string | undefined>(
    initialProducts.length > 0 ? initialProducts[initialProducts.length - 1].productId : undefined
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Reset when query changes
  useEffect(() => {
    if (query.trim() === "") {
      setProducts(initialProducts);
      setLastId(initialProducts.length > 0 ? initialProducts[initialProducts.length - 1].productId : undefined);
      setHasMore(true);
      return;
    }

    let cancelled = false;
    async function fetchSearch() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
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
    return () => { cancelled = true; };
  }, [query, initialProducts]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          try {
            const res = await fetch(
              `/api/products/search?q=${encodeURIComponent(query)}&after=${lastId ?? ""}`
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

      <ProductTable products={products} />

      {/* Loader sentinel for infinite scroll */}
      <div ref={observerRef} className="h-10 flex justify-center items-center text-gray-500">
        {loading ? "Loading more..." : hasMore ? "Scroll for more..." : "No more results"}
      </div>
    </div>
  );
}
