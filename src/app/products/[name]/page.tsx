import ProductDetailClient from "../../components/ProductDetailClient";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params; // await here
  const decoded = decodeURIComponent(name);

  return <ProductDetailClient name={decoded} />;
}
