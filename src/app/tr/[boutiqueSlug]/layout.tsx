import { notFound } from "next/navigation";
import { TrBoutiqueBrandedShell } from "@/components/tr/boutique/TrBoutiqueBrandedShell";
import { TrBoutiqueEditorialShell } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialShell";
import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";
import { hasBoutiqueBrand } from "@/lib/tr/boutiqueBrand";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import {
  safeGetBoutiqueStorefront,
  safeGetPublicBoutique,
} from "@/lib/tr/publicData";

/** Static marketplace segments — must not be captured by [boutiqueSlug]. */
const RESERVED_BOUTIQUE_SLUGS = new Set([
  "ara",
  "urunler",
  "favoriler",
  "butikler",
  "kombin",
  "parca",
  "sepet",
  "odeme",
  "cart",
  "checkout",
  "siparis-onay",
  "yakinda",
  "shop",
  "panel",
  "dev",
]);

interface BoutiqueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ boutiqueSlug: string }>;
}

export default async function BoutiqueLayout({
  children,
  params,
}: BoutiqueLayoutProps) {
  const { boutiqueSlug } = await params;

  if (RESERVED_BOUTIQUE_SLUGS.has(boutiqueSlug)) {
    notFound();
  }

  const boutique = await safeGetPublicBoutique(boutiqueSlug);

  if (!boutique) {
    notFound();
  }

  const homeLayout = resolveBoutiqueHomeLayout(boutiqueSlug);

  if (homeLayout === "editorial") {
    const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
    return (
      <TrBoutiqueEditorialShell
        boutique={boutique}
        products={storefront?.products ?? []}
      >
        {children}
      </TrBoutiqueEditorialShell>
    );
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
