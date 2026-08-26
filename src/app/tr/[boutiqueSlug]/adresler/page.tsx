import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueAddressBookPageContent } from "@/components/tr/boutique/TrBoutiqueAddressBookPageContent";
import { safeGetPublicBoutique } from "@/lib/tr/publicData";

interface AdreslerPageProps {
  params: Promise<{ boutiqueSlug: string }>;
}

export async function generateMetadata({
  params,
}: AdreslerPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  return {
    title: boutique ? `Adreslerim · ${boutique.name}` : "Adreslerim",
    robots: { index: false, follow: false },
  };
}

export default async function BoutiqueAdreslerPage({
  params,
}: AdreslerPageProps) {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  if (!boutique) notFound();

  return <TrBoutiqueAddressBookPageContent boutique={boutique} />;
}
