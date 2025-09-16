// src/app/products/[name]/page.tsx
import ProductDetailClient from "../../components/ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  return <ProductDetailClient decodedName={decoded} />;
}
