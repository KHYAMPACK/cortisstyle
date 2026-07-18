import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrLookPage } from "@/components/tr/TrLookPage";
import {
  safeGetPublishedTrLookBySlug,
  safeListPublishedTrLooks,
} from "@/lib/tr/looks";
import { isTrMarketplaceCartEnabled } from "@/lib/tr/platform";
import { safeListPublicCatalogProducts } from "@/lib/tr/publicData";
import {
  pickRelatedLooks,
  pickRelatedProducts,
} from "@/lib/tr/recommendations";

interface TrKombinPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TrKombinPageProps): Promise<Metadata> {
  const { slug } = await params;
  const look = await safeGetPublishedTrLookBySlug(slug);
  if (!look) return { title: "Kombin" };
  return {
    title: look.title,
    description: look.subtitle ?? undefined,
  };
}

export default async function TrKombinPage({ params }: TrKombinPageProps) {
  const { slug } = await params;
  const [look, allLooks, catalog, cartEnabled] = await Promise.all([
    safeGetPublishedTrLookBySlug(slug),
    safeListPublishedTrLooks(),
    safeListPublicCatalogProducts(),
    isTrMarketplaceCartEnabled(),
  ]);

  if (!look) notFound();

  const excludeProductIds = look.products.map((product) => product.id);
  const relatedLooks = pickRelatedLooks({
    looks: allLooks,
    excludeIds: [look.id],
    limit: 4,
  });
  const relatedProducts = pickRelatedProducts({
    catalog,
    excludeIds: excludeProductIds,
    limit: 8,
  });

  return (
    <TrLookPage
      look={look}
      relatedLooks={relatedLooks}
      relatedProducts={relatedProducts}
      cartEnabled={cartEnabled}
    />
  );
}
