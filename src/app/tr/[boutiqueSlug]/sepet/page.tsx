import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueCartPageContent } from "@/components/tr/boutique/editorial/TrBoutiqueCartPageContent";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
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
    title: "Sepet",
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

  const catalog: TrProductWithBoutique[] = storefront.products.map(
    (product) => ({
      ...product,
      boutique: storefront,
    }),
  );
  const iyzicoCheckout = await boutiqueOffersIyzicoCheckout(storefront.slug);

  return (
    <TrBoutiqueCartPageContent
      boutique={storefront}
      catalog={catalog}
      iyzicoCheckout={iyzicoCheckout}
    />
  );
}
