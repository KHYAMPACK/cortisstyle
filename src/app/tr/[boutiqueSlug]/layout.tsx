import { notFound } from "next/navigation";
import { TrBoutiqueBrandedShell } from "@/components/tr/boutique/TrBoutiqueBrandedShell";
import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";
import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { safeGetBoutiqueStorefront, safeGetPublicBoutique } from "@/lib/tr/publicData";

interface BoutiqueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ boutiqueSlug: string }>;
}

export default async function BoutiqueLayout({
  children,
  params,
}: BoutiqueLayoutProps) {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);

  if (!boutique) {
    notFound();
  }

  if (hasBoutiqueBrand(boutique)) {
    const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

    return (
      <TrBoutiqueBrandedShell
        boutique={boutique}
        products={storefront?.products ?? []}
      >
        {children}
      </TrBoutiqueBrandedShell>
    );
  }

  return <TrMarketplaceChrome>{children}</TrMarketplaceChrome>;
}
