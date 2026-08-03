import { TrBoutiqueAuthPageContent } from "@/components/tr/boutique/TrBoutiqueAuthPageContent";
import { safeGetPublicBoutique } from "@/lib/tr/publicData";
import { notFound } from "next/navigation";

interface GirisPageProps {
  params: Promise<{ boutiqueSlug: string }>;
}

export default async function BoutiqueGirisPage({ params }: GirisPageProps) {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  if (!boutique) notFound();

  return <TrBoutiqueAuthPageContent boutique={boutique} />;
}
