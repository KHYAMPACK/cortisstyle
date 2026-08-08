import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueFavoritesPageContent } from "@/components/tr/boutique/TrBoutiqueFavoritesPageContent";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import { withEditorialDemoProducts } from "@/lib/tr/looks/editorialDemoProducts";
import { safeGetBoutiqueStorefront } from "@/lib/tr/publicData";

interface BoutiqueFavoritesPageProps {
  params: Promise<{ boutiqueSlug: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueFavoritesPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    return { title: "Favoriler" };
  }

  return {
    title: `Favoriler — ${storefront.name}`,
    description: `${storefront.name} favorileriniz.`,
  };
}

export default async function BoutiqueFavoritesPage({
  params,
}: BoutiqueFavoritesPageProps) {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    notFound();
  }

  if (
    resolveBoutiqueHomeLayout(boutiqueSlug, storefront.homeLayout) !==
    "editorial"
  ) {
    notFound();
  }

  // Warm demo products into the boutique products provider via layout catalog.
  withEditorialDemoProducts(storefront, storefront.products);

  return <TrBoutiqueFavoritesPageContent boutique={storefront} />;
}
