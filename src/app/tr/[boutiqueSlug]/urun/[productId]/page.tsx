import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueProductPage } from "@/components/tr/boutique/pdp/TrBoutiqueProductPage";
import { TR_PDP_FROM_CADDE } from "@/lib/tr/paths";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import {
  safeGetPublicColorSiblings,
  safeGetPublicProductByBoutiqueSlugAndId,
} from "@/lib/tr/publicData";

interface BoutiqueProductPageProps {
  params: Promise<{ boutiqueSlug: string; productId: string }>;
  searchParams: Promise<{ from?: string }>;
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
    description:
      product.description ?? `${product.title} — ${product.boutique.name}`,
  };
}

export default async function BoutiqueProductPage({
  params,
  searchParams,
}: BoutiqueProductPageProps) {
  const { boutiqueSlug, productId } = await params;
  const { from } = await searchParams;
  const product = await safeGetPublicProductByBoutiqueSlugAndId(
    boutiqueSlug,
    productId,
  );

  if (!product) {
    notFound();
  }

  const entry = from === TR_PDP_FROM_CADDE ? "cadde" : "store";
  const colorSiblings = await safeGetPublicColorSiblings(product);
  const iyzicoCheckout = await boutiqueOffersIyzicoCheckout(
    product.boutique.slug,
  );

  return (
    <TrBoutiqueProductPage
      product={product}
      entry={entry}
      colorSiblings={colorSiblings}
      iyzicoCheckout={iyzicoCheckout}
    />
  );
}
