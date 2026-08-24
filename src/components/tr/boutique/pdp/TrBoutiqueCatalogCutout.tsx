import Image from "next/image";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrBoutiqueCatalogCutoutProps {
  product: TrProductWithBoutique;
  branded?: boolean;
}

/**
 * Separate from the main PDP gallery — shows the marketplace catalog cutout
 * framed with boutique accent so it matches the shop vibe.
 */
export function TrBoutiqueCatalogCutout({
  product,
  branded = false,
}: TrBoutiqueCatalogCutoutProps) {
  const cutout = getProductCoverImageFor("marketplace", product);
  const hasDedicatedCutout =
    (product.marketplaceImages ?? []).some((url) => Boolean(url?.trim()));

  if (!cutout || !hasDedicatedCutout || isTrDemoIconSrc(cutout)) {
    return null;
  }

  const accent = product.boutique.themeAccent?.trim() || "#C2185B";

  return (
    <aside
      className={
        branded
          ? "mt-8 border-t border-black/5 pt-6"
          : "mt-6 border-t border-blueprint-border pt-5"
      }
      aria-label="Katalog görünümü"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p
          className="font-mono text-[9px] tracking-[0.28em] uppercase"
          style={{ color: accent }}
        >
          Katalog görünümü
        </p>
        <p className="text-[10px] text-neutral-500">
          Temiz paket kesiti
        </p>
      </div>

      <div
        className="relative mx-auto aspect-[2/3] max-w-[220px] overflow-hidden md:max-w-[260px]"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: `inset 0 0 0 1px ${accent}33`,
        }}
      >
        <Image
          src={cutout}
          alt=""
          fill
          sizes="260px"
          className="object-contain p-6"
        />
      </div>
    </aside>
  );
}
