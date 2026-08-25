import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrClothPage } from "@/components/tr/TrClothPage";
import { withLookbookPieceImages } from "@/lib/tr/lookbookImages";
import {
  safeGetPublicColorSiblings,
  safeGetPublicProduct,
  safeListPublicCatalogProducts,
} from "@/lib/tr/publicData";
import { excludeColorSiblingIds } from "@/lib/tr/catalog/colorSiblings";
import { pickRelatedProducts } from "@/lib/tr/recommendations";

interface TrParcaPageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({
  params,
}: TrParcaPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await safeGetPublicProduct(productId);
  if (!product) return { title: "Parça" };
  return {
    title: product.title,
    description: product.description ?? undefined,
  };
}

export default async function TrParcaPage({ params }: TrParcaPageProps) {
  const { productId } = await params;
  const [rawProduct, catalog] = await Promise.all([
    safeGetPublicProduct(productId),
    safeListPublicCatalogProducts(),
  ]);

  if (!rawProduct) notFound();

  const product = withLookbookPieceImages(rawProduct);
  const colorSiblings = await safeGetPublicColorSiblings(product);
  const relatedProducts = pickRelatedProducts({
    catalog,
    excludeIds: excludeColorSiblingIds(product),
    category: product.category,
    limit: 8,
  });

  return (
    <TrClothPage
      product={product}
      relatedProducts={relatedProducts}
      colorSiblings={colorSiblings}
    />
  );
}
