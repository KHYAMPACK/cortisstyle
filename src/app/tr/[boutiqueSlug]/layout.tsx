import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrBoutiqueBrandedShell } from "@/components/tr/boutique/TrBoutiqueBrandedShell";
import { TrBoutiqueEditorialShell } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialShell";
import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";
import {
  hasBoutiqueBrand,
  resolveBoutiqueBrandLabel,
  resolveBoutiqueDocumentDescription,
  resolveBoutiqueDocumentTitle,
  resolveBoutiqueFaviconUrl,
} from "@/lib/tr/boutiqueBrand";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import { withEditorialDemoProducts } from "@/lib/tr/looks/editorialDemoProducts";
import {
  safeGetBoutiqueStorefront,
  safeGetPublicBoutique,
} from "@/lib/tr/publicData";
import { resolveStorefrontTheme } from "@/lib/tr/storefrontTheme";

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
  const brandTitle = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);
  const documentTitle = resolveBoutiqueDocumentTitle(
    boutique.slug,
    boutique.name,
  );
  const documentDescription = resolveBoutiqueDocumentDescription(
    boutique.slug,
    boutique.description,
    boutique.name,
  );

  return {
    // `absolute` + local template so parent `/tr` “— Cortisstyle” does not leak onto white-label boutiques.
    title: {
      absolute: documentTitle,
      default: documentTitle,
      template: `%s · ${brandTitle}`,
    },
    description: documentDescription,
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
  const theme = resolveStorefrontTheme(boutiqueSlug, boutique.homeLayout);

  if (theme === "editorial" || homeLayout === "editorial") {
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
