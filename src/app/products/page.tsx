import ProductCatalog from "../components/ProductCatalog";
import { getProductsPage } from "../services/inflow";
import type { ProductSummaryUI } from "../services/inflow";

export default async function ProductsPage() {
  // fetch initial batch
  const { products = [] } = await getProductsPage(80);

  // derive distinct categories
  const categories = ["All", ...Array.from(new Set(
    products.map((p) => p.topLevelCategory || "Uncategorized")
  ))];

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Product Catalog
            </h2>
          </div>

          {/* ✅ pass categories into ProductCatalog */}
          <ProductCatalog
            initialProducts={products as ProductSummaryUI[]}
            categories={categories}
          />
        </div>
      </section>
    </main>
  );
}
