import { TrHomeHero } from "@/components/tr/TrHomeHero";
import { TrLookSection } from "@/components/tr/TrLookSection";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { safeListPublishedTrLooks, TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import { isTrMarketplaceCartEnabled } from "@/lib/tr/platform";
import { trProductsPath } from "@/lib/tr/paths";

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
          className="border-b border-blueprint-border border-l-2 border-l-brand-primary px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-meta md:px-10"
          role="status"
        >
          Demo alışveriş açık — ikon ürünleri sepete ekleyip ödeme akışını
          deneyebilirsiniz.
        </p>
      ) : (
        <p
          className="border-b border-blueprint-border border-l-2 border-l-brand-primary px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-meta md:px-10"
          role="status"
        >
          Online ödeme yakında — şimdilik kombin ve ürün keşfi açık.
        </p>
      )}

      <TrLookSection looks={looks} cartEnabled={cartEnabled} />

      <section aria-label="Parçalar">
        <TrSectionHeader
          kicker="Parçalar"
          title="Tüm ürünler"
          description="Kombinlerin dışındaki kataloğu kategori ve arama ile gezin."
        >
          <TrSoftNavLink
            href={trProductsPath()}
            className="inline-flex border border-jet-black bg-white px-6 py-3.5 text-[11px] tracking-[0.2em] text-neutral-900 uppercase transition-colors hover:border-brand-primary hover:bg-brand-primary hover:text-white"
          >
            Ürünlere git →
          </TrSoftNavLink>
        </TrSectionHeader>
      </section>
    </div>
  );
}
