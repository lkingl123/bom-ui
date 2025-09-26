import ProductCatalog from "../components/ProductCatalog";
import { getProductsPage } from "../services/inflow";
import type { ProductSummary } from "../types";

export default async function ProductsPage() {
  // ✅ fetch first 80 as initial batch
  const { products = [] } = await getProductsPage(80);

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Product Catalog
            </h2>
            <span className="text-sm text-gray-500">
              Displaying {products.length} products per page
            </span>
          </div>

          <ProductCatalog initialProducts={products as ProductSummary[]} />
        </div>
      </section>
    </main>
  );
}
