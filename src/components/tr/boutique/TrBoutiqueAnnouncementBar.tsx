import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueAnnouncementBarProps {
  boutique: TrBoutiquePublic;
}

function buildAnnouncementSegments(boutique: TrBoutiquePublic): string[] {
  const segments: string[] = [];

  const shipping = boutique.shippingNote?.trim();
  if (shipping) segments.push(shipping);

  const exchange = boutique.exchangePolicy?.trim();
  if (exchange) segments.push(exchange);

  if (segments.length === 0) {
    segments.push("Yeni sezon · alışverişe başla");
  }

  return segments;
}

export function TrBoutiqueAnnouncementBar({
  boutique,
}: TrBoutiqueAnnouncementBarProps) {
  const accent = resolveBoutiqueThemeAccent(boutique);
  const segments = buildAnnouncementSegments(boutique);
  const tickerText = segments.join(" · ");

  return (
    <div
      className="relative overflow-hidden border-b border-black/5 py-2"
      style={{ backgroundColor: accent }}
      aria-live="off"
    >
      <div className="boutique-announcement-track flex w-max whitespace-nowrap text-[10px] tracking-[0.14em] text-white uppercase motion-reduce:hidden">
        <span className="px-6">{tickerText}</span>
        <span className="px-6" aria-hidden>
          {tickerText}
        </span>
        <span className="px-6" aria-hidden>
          {tickerText}
        </span>
      </div>

      <p className="hidden px-5 text-center text-[10px] tracking-[0.14em] text-white uppercase motion-reduce:block">
        {tickerText}
      </p>
    </div>
  );
}
