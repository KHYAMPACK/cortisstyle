import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrBoutiqueEditorialPlp } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialPlp";
import { safeGetBoutiqueStorefront } from "@/lib/tr/publicData";

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
    title: "Ürünler",
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
