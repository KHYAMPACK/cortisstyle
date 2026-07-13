import { TrBoutiqueCard } from "@/components/tr/TrBoutiqueCard";
import { TrHomeHero } from "@/components/tr/TrHomeHero";
import { TrLookSection } from "@/components/tr/TrLookSection";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { getProductCoverImage } from "@/lib/tr/paths";
import { safeListPublishedTrLooks } from "@/lib/tr/looks";
import {
  safeGetBoutiqueStorefront,
  safeListFeaturedProducts,
  safeListPublicBoutiques,
} from "@/lib/tr/publicData";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";

export default async function TrMarketplaceHomePage() {
  const [boutiques, featuredProducts, looks] = await Promise.all([
    safeListPublicBoutiques(),
    safeListFeaturedProducts(8),
    safeListPublishedTrLooks(),
  ]);

  const storefronts = await Promise.all(
    boutiques.map(async (boutique) => {
      const storefront = await safeGetBoutiqueStorefront(boutique.slug);
      return {
        boutique,
        productCount: storefront?.products.length ?? 0,
        coverImage: storefront?.products[0]
          ? getProductCoverImage(storefront.products[0])
          : null,
      };
    }),
  );

  const checkoutEnabled = isTrCheckoutEnabled();

  return (
    <div>
      <TrHomeHero />

      {!checkoutEnabled ? (
        <p
          className="border-b border-blueprint-border px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-meta md:px-10"
          role="status"
        >
          Online ödeme yakında — şimdilik kombin ve ürün keşfi açık.
        </p>
      ) : null}

      <TrLookSection looks={looks} />

      <section aria-label="Yeni parçalar">
        <TrSectionHeader
          kicker="[ PARÇALAR ]"
          title="Yeni eklenenler"
          description="Tek parçalar — her kart bir butiğe aittir."
        />

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-[2px] gap-y-0 border-b border-black/5 bg-white md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <TrProductCard
                key={product.id}
                product={product}
                showBoutique
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="border-b border-blueprint-border px-5 py-12 md:px-10">
            <p className="text-meta max-w-xl text-[12px] leading-relaxed">
              Henüz listelenen ürün yok. Butikler ürün ekledikçe burada
              görünecek.
            </p>
          </div>
        )}
      </section>

      <section id="cadde" className="scroll-mt-20" aria-label="Butik caddesi">
        <TrSectionHeader
          kicker="[ CADDE ]"
          title="Butik vitrinleri"
          description="Ağın parçası olan bağımsız butikler — her biri kendi vitrinine sahip."
        />

        {storefronts.length > 0 ? (
          <div className="grid grid-cols-1 gap-px border-b border-blueprint-border bg-blueprint-border sm:grid-cols-2 lg:grid-cols-3">
            {storefronts.map(({ boutique, productCount, coverImage }) => (
              <TrBoutiqueCard
                key={boutique.id}
                boutique={boutique}
                productCount={productCount}
                coverImage={coverImage}
              />
            ))}
          </div>
        ) : (
          <div className="border-b border-blueprint-border px-5 py-12 md:px-10">
            <p className="text-meta max-w-xl text-[12px] leading-relaxed">
              İlk butikler yakında bu caddeye çıkacak.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
