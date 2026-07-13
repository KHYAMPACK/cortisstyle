import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueProductPage } from "@/components/tr/boutique/pdp/TrBoutiqueProductPage";
import { safeGetPublicProductByBoutiqueSlugAndId } from "@/lib/tr/publicData";

interface BoutiqueProductPageProps {
  params: Promise<{ boutiqueSlug: string; productId: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueProductPageProps): Promise<Metadata> {
  const { boutiqueSlug, productId } = await params;
  const product = await safeGetPublicProductByBoutiqueSlugAndId(
    boutiqueSlug,
    productId,
  );

  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  return {
    title: product.title,
    description: product.description ?? `${product.title} — ${product.boutique.name}`,
  };
}

export default async function BoutiqueProductPage({
  params,
}: BoutiqueProductPageProps) {
  const { boutiqueSlug, productId } = await params;
  const product = await safeGetPublicProductByBoutiqueSlugAndId(
    boutiqueSlug,
    productId,
  );

  if (!product) {
    notFound();
  }

  return <TrBoutiqueProductPage product={product} />;
}
