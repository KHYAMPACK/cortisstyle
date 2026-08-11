import type { Metadata } from "next";
import { headers } from "next/headers";
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
import { preferredBoutiqueOrigin } from "@/lib/tr/seo/storefrontSeo";
import { siteLegal } from "@/lib/siteLegal";
import { resolveStorefrontTheme } from "@/lib/tr/storefrontTheme";
import { normalizeBoutiqueHost, resolveBoutiqueSlugFromHost } from "@/lib/tr/customDomain";
import { trBoutiquePath } from "@/lib/tr/paths";

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

/** Never cache empty/404 boutique lookups — storefronts are DB-backed. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const headerList = await headers();
  const requestHost = normalizeBoutiqueHost(
    headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      headerList.get("host") ||
      "",
  );
  const hostSlug = requestHost
    ? resolveBoutiqueSlugFromHost(requestHost)
    : null;
  const onBoutiqueDomain = hostSlug === boutique.slug;
  const metadataBase = new URL(
    onBoutiqueDomain && requestHost
      ? `https://${requestHost}`
      : preferredBoutiqueOrigin(boutique.slug) || siteLegal.siteUrl,
  );
  const canonicalPath = onBoutiqueDomain
    ? "/"
    : trBoutiquePath(boutique.slug);

  return {
    // `absolute` + local template so parent `/tr` “— Cortisstyle” does not leak onto white-label boutiques.
    metadataBase,
    title: {
      absolute: documentTitle,
      default: documentTitle,
      template: `%s · ${brandTitle}`,
    },
    description: documentDescription,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: brandTitle,
      title: documentTitle,
      description: documentDescription,
      url: canonicalPath,
    },
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
