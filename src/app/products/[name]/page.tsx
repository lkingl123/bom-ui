import ProductDetailClient from "../../components/ProductDetailClient";

export default function ProductDetail({
  params,
}: {
  params: { name: string };
}) {
  const decoded = decodeURIComponent(params.name);

  return <ProductDetailClient name={decoded} />;
}
