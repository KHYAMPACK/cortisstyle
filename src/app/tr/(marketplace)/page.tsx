import { CaddePlusReveal } from "@/components/tr/marketplace/CaddePlusReveal";
import { TrHomeHero } from "@/components/tr/TrHomeHero";
import { TrLookSection } from "@/components/tr/TrLookSection";
import { loadCaddeHeroPoses } from "@/lib/tr/marketplace/caddeHero";
import { CADDE_STATUS } from "@/lib/tr/marketplace/caddeUi";
import { safeListPublishedTrLooks, TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import { isTrMarketplaceCartEnabled } from "@/lib/tr/platform";

export default async function TrMarketplaceHomePage() {
  const [looks, cartEnabled] = await Promise.all([
    safeListPublishedTrLooks(),
    isTrMarketplaceCartEnabled(),
  ]);
  const heroPoses = loadCaddeHeroPoses();

  return (
    <div>
      <div className="sticky top-0 z-0">
        <TrHomeHero
          poses={heroPoses}
          nextSectionId={TR_LOOKS_SECTION_ID}
          nextSectionLabel="Kombinler"
        />
      </div>

      <div className="relative z-10 min-h-dvh bg-ice-floor shadow-[0_-18px_50px_rgba(0,0,0,0.14)]">
        {cartEnabled ? (
          <p className={CADDE_STATUS} role="status">
            Demo alışveriş açık — ikon ürünleri sepete ekleyip ödeme akışını
            deneyebilirsiniz.
          </p>
        ) : (
          <p className={CADDE_STATUS} role="status">
            Online ödeme yakında — şimdilik kombin ve ürün keşfi açık.
          </p>
        )}

        <TrLookSection looks={looks} cartEnabled={cartEnabled} />
        <CaddePlusReveal />
      </div>
    </div>
  );
}
