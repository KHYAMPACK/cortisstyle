import { MinimoraCenterCta } from "@/components/tr/boutique/minimora/sections/MinimoraCenterCta";
import { MinimoraClosingHero } from "@/components/tr/boutique/minimora/sections/MinimoraClosingHero";
import { MinimoraDualCards } from "@/components/tr/boutique/minimora/sections/MinimoraDualCards";
import { MinimoraFeatureMarquee } from "@/components/tr/boutique/minimora/sections/MinimoraFeatureMarquee";
import { MinimoraFeatureSplit } from "@/components/tr/boutique/minimora/sections/MinimoraFeatureSplit";
import { MinimoraGalleryCarousel } from "@/components/tr/boutique/minimora/sections/MinimoraGalleryCarousel";
import { MinimoraHowItWorks } from "@/components/tr/boutique/minimora/sections/MinimoraHowItWorks";
import { MinimoraImmersiveHero } from "@/components/tr/boutique/minimora/sections/MinimoraImmersiveHero";
import { MinimoraSplitHero } from "@/components/tr/boutique/minimora/sections/MinimoraSplitHero";
import { MinimoraTrustHeadline } from "@/components/tr/boutique/minimora/sections/MinimoraTrustHeadline";
import { minimoraHomeContent } from "@/components/tr/boutique/minimora/minimoraHomeContent";
import {
  trBoutiqueProductPath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";
import type { TrBoutiquePublic, TrProduct } from "@/types/tr-marketplace";

interface TrMinimoraHomePageProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
}

export function TrMinimoraHomePage({
  boutique,
  products,
}: TrMinimoraHomePageProps) {
  const orderHref =
    products[0]?.id != null
      ? trBoutiqueProductPath(boutique.slug, products[0].id)
      : trBoutiqueProductsPath(boutique.slug);

  const howItWorksHref = `#${minimoraHomeContent.howItWorks.id}`;
  const galleryHref = `#${minimoraHomeContent.galleryAnchorId}`;

  return (
    <div className="min-w-0 bg-[#FDFBF7]">
      <MinimoraSplitHero orderHref={orderHref} />
      <MinimoraFeatureMarquee />
      <MinimoraTrustHeadline />
      <MinimoraDualCards orderHref={orderHref} galleryHref={galleryHref} />
      <MinimoraGalleryCarousel orderHref={orderHref} />
      <MinimoraImmersiveHero howItWorksHref={howItWorksHref} />
      <MinimoraCenterCta orderHref={orderHref} />
      <MinimoraFeatureSplit />
      <MinimoraClosingHero howItWorksHref={howItWorksHref} />
      <MinimoraHowItWorks />
    </div>
  );
}
