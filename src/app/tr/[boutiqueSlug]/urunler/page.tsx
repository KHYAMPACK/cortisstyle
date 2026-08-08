import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrBoutiqueEditorialPlp } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialPlp";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import { withEditorialDemoProducts } from "@/lib/tr/looks/editorialDemoProducts";
import { safeGetBoutiqueStorefront } from "@/lib/tr/publicData";
import { resolveStorefrontTheme } from "@/lib/tr/storefrontTheme";

interface BoutiqueProductsPageProps {
  params: Promise<{ boutiqueSlug: string }>;
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
    title: `Ürünler — ${storefront.name}`,
    description:
      storefront.description ??
      `${storefront.name} ürün kataloğu.`,
  };
}

export default async function BoutiqueProductsPage({
  params,
}: BoutiqueProductsPageProps) {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    notFound();
  }

  const theme = resolveStorefrontTheme(boutiqueSlug, storefront.homeLayout);
  const products = withEditorialDemoProducts(storefront, storefront.products);

  if (
    theme === "editorial" ||
    resolveBoutiqueHomeLayout(boutiqueSlug, storefront.homeLayout) ===
      "editorial"
  ) {
    return (
      <Suspense
        fallback={
          <div className="px-5 py-16 text-center text-[12px] tracking-[0.14em] text-neutral-500 uppercase">
            Ürünler yükleniyor…
          </div>
        }
      >
        <TrBoutiqueEditorialPlp boutique={storefront} products={products} />
      </Suspense>
    );
  }

  notFound();
}
