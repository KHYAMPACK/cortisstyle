import { BrandLogo } from "@/components/BrandLogo";
import { TrLookBoutiqueCredits } from "@/components/tr/TrLookBoutiqueCredits";

/** Ghost look covers when the home look rail has no published looks. */
export const TR_HOME_PLACEHOLDER_LOOKS = 3;

/** Ghost product tiles under each placeholder look (enough to scroll). */
export const TR_HOME_PLACEHOLDER_PIECES_PER_LOOK = 6;

export function TrPlaceholderProductCard({ index }: { index: number }) {
  return (
    <div
      className="block shrink-0 bg-white"
      aria-hidden={index > 0}
      {...(index === 0
        ? { role: "status", "aria-label": "Ürünler yakında" }
        : {})}
    >
      <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden bg-ice-floor">
        <BrandLogo
          variant="onLight"
          className="h-10 w-auto opacity-40 md:h-12"
        />
      </div>
      <div className="px-2 pt-3 pb-5 md:px-2.5">
        <div className="h-3 w-3/4 max-w-[9rem] bg-neutral-200/80" />
        <div className="mt-2 h-3 w-16 bg-neutral-100" />
        <div className="mt-2 h-2.5 w-20 bg-neutral-100" />
      </div>
    </div>
  );
}

/** Intl-style paper look card chrome with CS logo credits (ghost). */
export function TrPlaceholderLookCard({ index }: { index: number }) {
  return (
    <div
      className="surface-canvas-paper block w-full overflow-hidden border border-blueprint-border"
      aria-hidden={index > 0}
      {...(index === 0
        ? { role: "status", "aria-label": "Kombinler yakında" }
        : {})}
    >
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-neutral-100">
        <BrandLogo
          variant="onLight"
          className="h-12 w-auto opacity-35 md:h-14"
        />
      </div>
      <div className="border-t border-blueprint-border px-3 py-3 md:px-4 md:py-4">
        <div className="h-2.5 w-32 bg-neutral-200/90" />
        <div className="mt-2 h-2 w-20 bg-neutral-100" />
        <TrLookBoutiqueCredits boutiques={[]} placeholderCount={2} />
      </div>
    </div>
  );
}
