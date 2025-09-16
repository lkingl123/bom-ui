import ExportPDFButton from "../../components/ExportPDFButton";
import IngredientTable from "../../components/IngredientTable";
import Link from "next/link";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  // Await the params (Next.js 15 requirement)
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const res = await fetch(
    `https://bom-api.fly.dev/products/${encodeURIComponent(decoded)}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch product details");
  }

  const product = await res.json();

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] hover:scale-105 active:scale-95 cursor-pointer transition"
          >
            ← Back to Catalog
          </Link>
          <ExportPDFButton product={product} />
        </div>

        {/* Product Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {product.product_name}
        </h1>
        <p className="text-gray-600 mb-6">
          SKU: {product.sku || "-"} | Barcode: {product.barcode || "-"}
        </p>

        {/* Ingredient Table */}
        <IngredientTable
          components={product.components}
          totalCost={product.calculated_cost}
        />
      </section>
    </main>
  );
}
