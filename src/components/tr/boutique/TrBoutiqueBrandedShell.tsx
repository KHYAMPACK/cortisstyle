import {
  hasBoutiqueBrand,
  resolveBoutiqueBackground,
  resolveBoutiqueThemeAccent,
} from "@/lib/tr/boutiqueBrand";
import { TrBoutiqueFooter } from "@/components/tr/boutique/TrBoutiqueFooter";
import { TrBoutiqueHeader } from "@/components/tr/boutique/TrBoutiqueHeader";
import { TrBoutiqueTrustStrip } from "@/components/tr/boutique/TrBoutiqueTrustStrip";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueBrandedShellProps {
  boutique: TrBoutiquePublic;
  children: React.ReactNode;
}

export function TrBoutiqueBrandedShell({
  boutique,
  children,
}: TrBoutiqueBrandedShellProps) {
  if (!hasBoutiqueBrand(boutique)) {
    return <>{children}</>;
  }

  const accent = resolveBoutiqueThemeAccent(boutique);
  const background = resolveBoutiqueBackground();

  return (
    <div
      className="flex min-h-full flex-col text-neutral-900"
      style={
        {
          backgroundColor: background,
          "--boutique-accent": accent,
        } as React.CSSProperties
      }
    >
      <TrBoutiqueHeader boutique={boutique} />
      <TrBoutiqueTrustStrip boutique={boutique} />
      <main className="flex-1">{children}</main>
      <TrBoutiqueFooter boutique={boutique} />
    </div>
  );
}
