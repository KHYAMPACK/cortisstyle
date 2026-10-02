import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache, Suspense } from "react";
import { TrBoutiqueEditorialPlp } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialPlp";
import { loadPublicCategoryPage } from "@/lib/tr/catalog/categoryPage";
import { trBoutiqueCategoryPath } from "@/lib/tr/paths";
import {
  storeAddress,
  storeCategoryUrl,
  storeCustomerPath,
} from "@/lib/tr/seo/storeAddress";
import { resolveSeoHostContext } from "@/lib/tr/seo/storefrontSeo";

interface BoutiqueCategoryPageProps {
  params: Promise<{ boutiqueSlug: string; categorySlug: string }>;
}

// The page and its metadata both need the category: load it once per request.
const loadCategory = cache(loadPublicCategoryPage);

export async function generateMetadata({
  params,
}: BoutiqueCategoryPageProps): Promise<Metadata> {
  const { boutiqueSlug, categorySlug } = await params;
  const result = await loadCategory(boutiqueSlug, categorySlug);
  if (result.kind !== "found") return { title: "Kategori bulunamadı" };

  const { category, boutique } = result;
  const { seo } = category;
  const address = {
    boutiqueSlug: boutique.slug,
    customDomain: boutique.customDomain,
  };
  const description =
    seo.description ||
    category.description?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `${category.name} — ${boutique.name}`;

  return {
    title: seo.title || category.name,
    description,
    alternates: {
      canonical: seo.canonical
        ? `${storeAddress(address).origin}${seo.canonical}`
        : storeCategoryUrl({ ...address, categorySlug: category.slug }),
    },
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function BoutiqueCategoryPage({
  params,
}: BoutiqueCategoryPageProps) {
  const { boutiqueSlug, categorySlug } = await params;
  const result = await loadCategory(boutiqueSlug, categorySlug);

  if (result.kind === "missing") notFound();

  // A renamed category: send visitors and search engines to its current address.
  if (result.kind === "redirect") {
    const host = await resolveSeoHostContext();
    permanentRedirect(
      storeCustomerPath(
        boutiqueSlug,
        trBoutiqueCategoryPath(boutiqueSlug, result.toSlug),
        host.kind === "boutique" ? "boutique-domain" : "platform",
      ),
    );
  }

  const { boutique, category, products } = result;

  // The shop's own product list (atelier or classic), on this category; filters and
  // sorting stay in the query string (plpLocation.ts).
  return (
    <Suspense
      fallback={
        <div className="px-5 py-16 text-center text-[12px] tracking-[0.14em] text-neutral-500 uppercase">
          Ürünler yükleniyor…
        </div>
      }
    >
      <TrBoutiqueEditorialPlp
        boutique={boutique}
        products={boutique.products}
        categoryId={category.slug}
        categoryScope={{
          ids: products.map((product) => product.id),
          ordered: category.sortCriterion != null,
        }}
        intro={category.description}
      />
    </Suspense>
  );
}
