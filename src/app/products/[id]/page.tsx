// src/app/products/[id]/page.tsx
import ProductDetailClient from "../../components/ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ await it
  const decoded = decodeURIComponent(id);

  return <ProductDetailClient productId={decoded} />;
}
