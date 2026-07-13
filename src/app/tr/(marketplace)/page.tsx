import { TrHomeHero } from "@/components/tr/TrHomeHero";
import { TrLookSection } from "@/components/tr/TrLookSection";
import { safeListPublishedTrLooks, TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import { isTrMarketplaceCartEnabled } from "@/lib/tr/platform";

export default async function TrMarketplaceHomePage() {
  const [looks, cartEnabled] = await Promise.all([
    safeListPublishedTrLooks(),
    isTrMarketplaceCartEnabled(),
  ]);

  return (
    <div>
      <TrHomeHero
        nextSectionId={TR_LOOKS_SECTION_ID}
        nextSectionLabel="Kombinler"
      />

      {cartEnabled ? (
        <p
          className="border-b border-blueprint-border px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-meta md:px-10"
          role="status"
        >
          Demo alışveriş açık — ikon ürünleri sepete ekleyip ödeme akışını
          deneyebilirsiniz.
        </p>
      ) : (
        <p
          className="border-b border-blueprint-border px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-meta md:px-10"
          role="status"
        >
          Online ödeme yakında — şimdilik kombin ve ürün keşfi açık.
        </p>
      )}

      <TrLookSection looks={looks} cartEnabled={cartEnabled} />
    </div>
  );
}
