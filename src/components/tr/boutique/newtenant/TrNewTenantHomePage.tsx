import { TrNewTenantBestSellers } from "@/components/tr/boutique/newtenant/sections/TrNewTenantBestSellers";
import { TrNewTenantBrandStory } from "@/components/tr/boutique/newtenant/sections/TrNewTenantBrandStory";
import { TrNewTenantCategoryRow } from "@/components/tr/boutique/newtenant/sections/TrNewTenantCategoryRow";
import { TrNewTenantCustomBanner } from "@/components/tr/boutique/newtenant/sections/TrNewTenantCustomBanner";
import { TrNewTenantFeatureShowcase } from "@/components/tr/boutique/newtenant/sections/TrNewTenantFeatureShowcase";
import { TrNewTenantHeroCarousel } from "@/components/tr/boutique/newtenant/sections/TrNewTenantHeroCarousel";
import { TrNewTenantPromoTiles } from "@/components/tr/boutique/newtenant/sections/TrNewTenantPromoTiles";
import { TrNewTenantTrustBadges } from "@/components/tr/boutique/newtenant/sections/TrNewTenantTrustBadges";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

/**
 * Structural clone of the PopSockets home page (hero carousel, promo
 * tiles, category row, trust badges, custom-design banner, best
 * sellers grid, feature showcase, brand story), narrowed to this
 * tenant's grips-only catalog and recolored to black/white/acid-green.
 * Section order mirrors popsockets.com/en-us/home. Real photography
 * TODO: swap TrNewTenantPlaceholderMedia blocks for shot product/
 * lifestyle imagery per section — nothing else needs to change.
 */
interface TrNewTenantHomePageProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
}

export function TrNewTenantHomePage({
  boutique,
  products,
}: TrNewTenantHomePageProps) {
  return (
    <div className="min-w-0 bg-[#FAFAFA]">
      <TrNewTenantHeroCarousel
        boutiqueSlug={boutique.slug}
        boutiqueName={boutique.name}
      />
      <TrNewTenantPromoTiles boutiqueSlug={boutique.slug} />
      <TrNewTenantCategoryRow boutiqueSlug={boutique.slug} />
      <TrNewTenantTrustBadges />
      <TrNewTenantCustomBanner boutiqueSlug={boutique.slug} />
      <TrNewTenantBestSellers boutiqueSlug={boutique.slug} products={products} />
      <TrNewTenantFeatureShowcase boutiqueSlug={boutique.slug} />
      <TrNewTenantBrandStory boutique={boutique} />
    </div>
  );
}
