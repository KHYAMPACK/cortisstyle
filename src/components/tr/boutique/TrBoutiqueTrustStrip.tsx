import { Truck } from "lucide-react";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueTrustStripProps {
  boutique: TrBoutiquePublic;
}

export function TrBoutiqueTrustStrip({ boutique }: TrBoutiqueTrustStripProps) {
  const note =
    boutique.shippingNote?.trim() || "Türkiye geneli ücretsiz kargo";

  return (
    <div
      className="border-b border-black/5 py-2.5 text-center text-[11px] tracking-[0.08em]"
      style={{ color: resolveBoutiqueThemeAccent(boutique) }}
    >
      <p className="inline-flex items-center justify-center gap-2">
        <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
        {note}
      </p>
    </div>
  );
}
