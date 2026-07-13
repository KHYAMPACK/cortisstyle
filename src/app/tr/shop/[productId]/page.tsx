import { notFound, permanentRedirect } from "next/navigation";
import { trBoutiqueProductPath } from "@/lib/tr/paths";
import { safeGetPublicProduct } from "@/lib/tr/publicData";

interface LegacyProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

/** Legacy marketplace PDP URL — redirects to canonical boutique-scoped route. */
export default async function LegacyProductDetailPage({
  params,
}: LegacyProductDetailPageProps) {
  const { productId } = await params;
  const product = await safeGetPublicProduct(productId);

  if (!product) {
    notFound();
  }

  permanentRedirect(
    trBoutiqueProductPath(product.boutique.slug, product.id),
  );
}
