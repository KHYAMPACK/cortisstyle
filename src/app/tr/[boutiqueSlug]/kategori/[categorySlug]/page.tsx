import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import { loadPublicCategoryPage } from "@/lib/tr/catalog/categoryPage";
import { trBoutiqueCategoryPath, trBoutiquePath } from "@/lib/tr/paths";
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

  const { boutique, category, path, children, products } = result;
  const parents = path.slice(0, -1);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8">
      <nav
        aria-label="Konum"
        className="mb-4 flex flex-wrap items-center gap-x-2 text-[11px] tracking-[0.12em] text-neutral-500 uppercase"
      >
        <Link href={trBoutiquePath(boutique.slug)} className="hover:text-neutral-900">
          {boutique.name}
        </Link>
        {parents.map((entry) => (
          <span key={entry.id} className="flex items-center gap-x-2">
            <span aria-hidden>/</span>
            <Link
              href={trBoutiqueCategoryPath(boutique.slug, entry.slug)}
              className="hover:text-neutral-900"
            >
              {entry.name}
            </Link>
          </span>
        ))}
      </nav>

      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.imageUrl}
            alt=""
            className="h-40 w-full rounded-sm object-cover md:h-44 md:w-64"
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-[22px] font-semibold tracking-[0.08em] text-neutral-900 uppercase md:text-[26px]">
            {category.name}
          </h1>
          {category.description ? (
            <p className="max-w-2xl text-[14px] leading-relaxed whitespace-pre-line text-neutral-600">
              {category.description}
            </p>
          ) : null}
          {children.length > 0 ? (
            <ul className="flex flex-wrap gap-2 pt-1">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={trBoutiqueCategoryPath(boutique.slug, child.slug)}
                    className="inline-block rounded-full border border-neutral-300 px-3.5 py-1.5 text-[12px] tracking-[0.06em] text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {products.length === 0 ? (
        <p className="py-16 text-center text-[13px] text-neutral-500">
          Bu kategoride henüz ürün yok.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id}>
              <TrBoutiqueEditorialProductCard
                product={product}
                boutiqueSlug={boutique.slug}
                boutiqueName={boutique.name}
                priority={index < 4}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
