import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueFavoritesPageContent } from "@/components/tr/boutique/TrBoutiqueFavoritesPageContent";
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
    title: "Favoriler",
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

  return <TrBoutiqueFavoritesPageContent boutique={storefront} />;
}
