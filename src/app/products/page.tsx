import ProductsPageWrapper from "./ProductsPageWrapper";

export default async function ProductsPage() {
  const res = await fetch("https://bom-api.fly.dev/products?", {
    next: { revalidate: 60 },
  });

  let products: any[] = [];
  try {
    products = await res.json();
  } catch (e) {
    console.error("Failed to parse products JSON:", e);
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <ProductsPageWrapper products={products} />
      </section>
    </main>
  );
}
