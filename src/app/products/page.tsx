import ProductCatalog from "../components/ProductCatalog";
import type { ProductSummary } from "../types";

export default async function ProductsPage() {
  const res = await fetch("https://bom-api.fly.dev/products?", {
    next: { revalidate: 60 },
  });
  const products: ProductSummary[] = await res.json();

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Product Catalog
            </h2>
            <span className="text-sm text-gray-500">
              {products.length} products available
            </span>
          </div>

          {/* ✅ Pass actual data, not the type */}
          <ProductCatalog products={products} />
        </div>
      </section>
    </main>
  );
}
