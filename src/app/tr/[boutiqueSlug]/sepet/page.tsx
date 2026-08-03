import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueCartPageContent } from "@/components/tr/boutique/editorial/TrBoutiqueCartPageContent";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import { withEditorialDemoProducts } from "@/lib/tr/looks/editorialDemoProducts";
import { safeGetBoutiqueStorefront } from "@/lib/tr/publicData";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface BoutiqueCartPageProps {
  params: Promise<{ boutiqueSlug: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueCartPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    return { title: "Sepet" };
  }

  return {
    title: `Sepet — ${storefront.name}`,
    description: `${storefront.name} sepetiniz.`,
  };
}

export default async function BoutiqueCartPage({
  params,
}: BoutiqueCartPageProps) {
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

  const products = withEditorialDemoProducts(storefront, storefront.products);
  const catalog: TrProductWithBoutique[] = products.map((product) => ({
    ...product,
    boutique: storefront,
  }));

  return (
    <TrBoutiqueCartPageContent boutique={storefront} catalog={catalog} />
  );
}
