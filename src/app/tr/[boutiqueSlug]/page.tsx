import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrBoutiqueCatalogSection } from "@/components/tr/boutique/TrBoutiqueCatalogSection";
import { TrBoutiqueFeaturedCategories } from "@/components/tr/boutique/TrBoutiqueFeaturedCategories";
import { TrBoutiqueProductGrid } from "@/components/tr/boutique/TrBoutiqueProductGrid";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import {
  hasBoutiqueBrand,
  resolveBoutiqueThemeAccent,
} from "@/lib/tr/boutiqueBrand";
import { buildFeaturedCategoryTiles } from "@/lib/tr/categoryFeatured";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { trHomePath } from "@/lib/tr/paths";
import { safeGetBoutiqueStorefront } from "@/lib/tr/publicData";

interface BoutiqueStorefrontPageProps {
  params: Promise<{ boutiqueSlug: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueStorefrontPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    return { title: "Butik bulunamadı" };
  }

  return {
    title: storefront.name,
    description:
      storefront.description ??
      `${storefront.name} — bağımsız butik ürün kataloğu.`,
  };
}

export default async function BoutiqueStorefrontPage({
  params,
}: BoutiqueStorefrontPageProps) {
  const { boutiqueSlug } = await params;
  const storefront = await safeGetBoutiqueStorefront(boutiqueSlug);

  if (!storefront) {
    notFound();
  }

  const branded = hasBoutiqueBrand(storefront);
  const accent = resolveBoutiqueThemeAccent(storefront);
  const checkoutEnabled = isTrCheckoutEnabled();
  const availableCount = storefront.products.filter(
    (product) => product.status === "available",
  ).length;
  const featuredTiles = buildFeaturedCategoryTiles(storefront.products);

  if (branded) {
    return (
      <>
        <section className="mx-auto max-w-6xl px-5 py-8 text-center md:px-8 md:py-10">
          {storefront.logoUrl ? (
            <div className="mb-4 flex justify-center">
              <Image
                src={storefront.logoUrl}
                alt={storefront.name}
                width={120}
                height={120}
                className="h-20 w-20 object-contain md:h-24 md:w-24"
                unoptimized
                priority
              />
            </div>
          ) : null}
          <h1
            className="font-serif text-3xl tracking-tight md:text-4xl"
            style={{ color: accent }}
          >
            {storefront.name}
          </h1>
          {storefront.description ? (
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-neutral-600">
              {storefront.description}
            </p>
          ) : null}
          <p className="mt-3 text-[11px] tracking-[0.12em] text-neutral-500 uppercase">
            {availableCount} ürün satışta
          </p>
        </section>

        <TrBoutiqueFeaturedCategories tiles={featuredTiles} />

        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
          <TrBoutiqueCatalogSection className="mb-14">
            <TrBoutiqueProductGrid
              products={storefront.products}
              accentColor={accent}
            />
          </TrBoutiqueCatalogSection>

          <section className="grid gap-10 border-t border-black/5 pt-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-xl tracking-tight text-neutral-900">
              Hakkımızda
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
              {storefront.description ??
                `${storefront.name}, seçilmiş parçaları Türkiye geneline ulaştırır.`}
            </p>
            {storefront.physicalAddress ? (
              <p className="mt-4 text-[12px] text-neutral-500">
                {storefront.physicalAddress}
              </p>
            ) : null}
          </div>

          <div>
            <h2 className="font-serif text-xl tracking-tight text-neutral-900">
              Nasıl sipariş verilir?
            </h2>
            {checkoutEnabled ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-neutral-600">
                <li>Beğendiğiniz ürünü seçin.</li>
                <li>Sepete ekleyin ve ödeme adımlarını tamamlayın.</li>
                <li>Sipariş onayı e-posta ile gönderilir.</li>
              </ol>
            ) : (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-neutral-600">
                <li>Beğendiğiniz ürünü seçin.</li>
                <li>
                  &quot;WhatsApp ile sipariş ver&quot; butonuna tıklayın — mesaj
                  otomatik hazırlanır.
                </li>
                <li>Beden ve adres bilgilerinizi paylaşın, ödeme detaylarını alın.</li>
              </ol>
            )}
          </div>
        </section>
        </div>
      </>
    );
  }

  return (
    <div>
      <section className="border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10">
        <Link
          href={trHomePath()}
          className="text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
        >
          ← Tüm butikler
        </Link>

        <p className="text-meta mt-6 text-[9px] tracking-[0.5em] uppercase">
          [ BUTİK ]
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-none tracking-[-0.03em] text-neutral-950 md:text-4xl">
          {storefront.name}
        </h1>
        {storefront.description ? (
          <p className="text-meta mt-4 max-w-2xl text-[12px] leading-relaxed tracking-[0.06em]">
            {storefront.description}
          </p>
        ) : null}
        <p className="text-meta mt-4 text-[10px] tracking-[0.18em] uppercase">
          {availableCount} satışta · {storefront.products.length} toplam ürün
        </p>
      </section>

      <section aria-label={`${storefront.name} ürünleri`}>
        <TrSectionHeader
          kicker="[ KATALOG ]"
          title="Ürünler"
          description="Bu butiğin listelediği tek parça ürünler."
        />

        {storefront.products.length > 0 ? (
          <div className="grid grid-cols-2 gap-px border-b border-blueprint-border bg-blueprint-border md:grid-cols-3 lg:grid-cols-4">
            {storefront.products.map((product, index) => (
              <TrProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="border-b border-blueprint-border px-5 py-12 md:px-10">
            <p className="text-meta text-[12px] leading-relaxed">
              Bu butikte henüz ürün yok.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
