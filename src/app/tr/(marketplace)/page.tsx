import { TrBoutiqueCard } from "@/components/tr/TrBoutiqueCard";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { TrSandboxBanner } from "@/components/tr/TrSandboxBanner";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { getProductCoverImage } from "@/lib/tr/paths";
import {
  safeGetBoutiqueStorefront,
  safeListFeaturedProducts,
  safeListPublicBoutiques,
} from "@/lib/tr/publicData";

export default async function TrMarketplaceHomePage() {
  const [boutiques, featuredProducts] = await Promise.all([
    safeListPublicBoutiques(),
    safeListFeaturedProducts(8),
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

  return (
    <div>
      <section className="border-b border-blueprint-border px-5 py-10 md:px-10 md:py-14">
        <p className="text-meta text-[9px] tracking-[0.5em] uppercase">
          [ TÜRKİYE PAZARI ]
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-3xl leading-none tracking-[-0.03em] text-neutral-950 md:text-5xl">
          Bağımsız butiklerden seçilmiş parçalar
        </h1>
        <p className="text-meta mt-4 max-w-2xl text-[12px] leading-relaxed tracking-[0.06em] md:text-[13px]">
          Her butik kendi ürün kataloğunu listeler. Kombinler ve editoryal
          lookbook Cortisstyle tarafından bu parçalardan oluşturulur.
        </p>
        <div className="mt-6 max-w-2xl">
          <TrSandboxBanner />
        </div>
      </section>

      <section aria-label="Öne çıkan ürünler">
        <TrSectionHeader
          kicker="[ ÜRÜNLER ]"
          title="Yeni eklenenler"
          description="Tek parça, stokta olan ürünler. Her kart bir butiğe aittir."
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
              Henüz listelenen ürün yok. Supabase migration çalıştırıldıktan sonra
              admin seed ile butik ve ürün ekleyebilirsiniz.
            </p>
          </div>
        )}
      </section>

      <section aria-label="Butikler">
        <TrSectionHeader
          kicker="[ BUTİKLER ]"
          title="Butik vitrinleri"
          description="Her butik kendi ürünlerini satar — kombin satışı yok."
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
              Henüz doğrulanmış butik yok. İlk butikleri seed API ile ekleyin.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
