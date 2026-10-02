import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { TrBoutiqueEditorialPlp } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialPlp";
import { loadPublicCategoryPage } from "@/lib/tr/catalog/categoryPage";
import { trBoutiqueCategoryPath } from "@/lib/tr/paths";
import { safeGetBoutiqueStorefront } from "@/lib/tr/publicData";
import { storeCustomerPath } from "@/lib/tr/seo/storeAddress";
import { resolveSeoHostContext } from "@/lib/tr/seo/storefrontSeo";

type SearchParams = Record<string, string | string[] | undefined>;

interface BoutiqueProductsPageProps {
  params: Promise<{ boutiqueSlug: string }>;
  searchParams: Promise<SearchParams>;
}

/**
 * An old `…/urunler?kategori=<slug>` address: the category's own page now lives at
 * `…/kategori/<slug>`. Redirects permanently, keeping the other filters, when the
 * category exists (or was renamed); anything else stays on the full list as before.
 */
async function redirectLegacyCategoryQuery(
  boutiqueSlug: string,
  query: SearchParams,
): Promise<void> {
  const raw = query.kategori;
  const kategori = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!kategori || kategori === "sale") return;

  const result = await loadPublicCategoryPage(boutiqueSlug, kategori);
  if (result.kind === "missing") return;
  const slug = result.kind === "redirect" ? result.toSlug : result.category.slug;

  const rest = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "kategori" || value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) rest.append(key, entry);
  }
  const qs = rest.toString();
  const host = await resolveSeoHostContext();
  permanentRedirect(
    storeCustomerPath(
      boutiqueSlug,
      `${trBoutiqueCategoryPath(boutiqueSlug, slug)}${qs ? `?${qs}` : ""}`,
      host.kind === "boutique" ? "boutique-domain" : "platform",
    ),
  );
}

export async function generateMetadata({
  params,
}: BoutiqueProductsPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    return { title: "Ürünler" };
  }

  return {
    title: "Ürünler",
    description:
      storefront.description ??
      `${storefront.name} ürün kataloğu.`,
  };
}

export default async function BoutiqueProductsPage({
  params,
  searchParams,
}: BoutiqueProductsPageProps) {
  const { boutiqueSlug } = await params;
  await redirectLegacyCategoryQuery(boutiqueSlug, await searchParams);
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="px-5 py-16 text-center text-[12px] tracking-[0.14em] text-neutral-500 uppercase">
          Ürünler yükleniyor…
        </div>
      }
    >
      <TrBoutiqueEditorialPlp
        boutique={storefront}
        products={storefront.products}
      />
    </Suspense>
  );
}
