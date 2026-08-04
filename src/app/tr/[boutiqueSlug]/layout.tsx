import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueBrandedShell } from "@/components/tr/boutique/TrBoutiqueBrandedShell";
import { TrBoutiqueEditorialShell } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialShell";
import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";
import {
  hasBoutiqueBrand,
  resolveBoutiqueFaviconUrl,
} from "@/lib/tr/boutiqueBrand";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import { withEditorialDemoProducts } from "@/lib/tr/looks/editorialDemoProducts";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boutiqueSlug: string }>;
}): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  if (RESERVED_BOUTIQUE_SLUGS.has(boutiqueSlug)) {
    return {};
  }

  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  if (!boutique) {
    return { title: "Butik bulunamadı" };
  }

  const favicon = resolveBoutiqueFaviconUrl(boutique);
  const brandTitle =
    boutique.slug === "pervinsoysalbutik" ? "Pervin Soysal" : boutique.name;

  return {
    title: {
      default: brandTitle,
      template: `%s · ${brandTitle}`,
    },
    description:
      boutique.description ??
      `${brandTitle} — online butik ürün kataloğu.`,
    icons: favicon
      ? {
          icon: [{ url: favicon, type: "image/png" }],
          shortcut: [{ url: favicon, type: "image/png" }],
          apple: [{ url: favicon, type: "image/png" }],
        }
      : undefined,
  };
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

  const homeLayout = resolveBoutiqueHomeLayout(
    boutiqueSlug,
    boutique.homeLayout,
  );

  if (homeLayout === "editorial") {
    const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);
    const products = withEditorialDemoProducts(
      boutique,
      storefront?.products ?? [],
    );
    return (
      <TrBoutiqueEditorialShell boutique={boutique} products={products}>
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
