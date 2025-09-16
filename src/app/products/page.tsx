import React from "react";
import ProductsPageWrapper from "./ProductsPageWrapper";
import { Product } from "../types"; // adjust path if needed

export default async function ProductsPage() {
  const res = await fetch("https://bom-api.fly.dev/products", {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  const products: Product[] = await res.json();

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Products</h1>
        <ProductsPageWrapper products={products} />
      </section>
    </main>
  );
}
