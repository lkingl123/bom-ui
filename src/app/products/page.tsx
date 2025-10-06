import ProductCatalog from "../components/ProductCatalog";
import { getProductsPage } from "../services/inflow";
import type { ProductSummaryUI } from "../services/inflow";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ forceRefresh?: string }>;
}) {
  // ✅ await the new async searchParams API
  const params = await searchParams;
  const forceRefresh = params?.forceRefresh === "true";

  // fetch initial batch (bypass cache only when needed)
  const { products = [] } = await getProductsPage(80, undefined, forceRefresh);

  // ✅ hardcoded top-level categories
  const TOP_LEVELS = [
    "Account",
    "Finished Goods",
    "Bulk",
    "Ingredients",
    "Materials",
  ];

  const categories = ["All", ...TOP_LEVELS];

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Product Catalog
            </h2>
          </div>

          <ProductCatalog
            initialProducts={products as ProductSummaryUI[]}
            categories={categories}
          />
        </div>
      </section>
    </main>
  );
}
