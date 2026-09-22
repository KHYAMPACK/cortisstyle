import Link from "next/link";
import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

/**
 * Static 2-up promo tiles under the hero — structural match for
 * PopSockets' "Browse PopSockets" tile grid (dark image, bold caption
 * bottom-left, small text CTA). Only the two categories this tenant
 * actually sells.
 */
interface TrNewTenantPromoTilesProps {
  boutiqueSlug: string;
}

export function TrNewTenantPromoTiles({
  boutiqueSlug,
}: TrNewTenantPromoTilesProps) {
  const tiles = [
    {
      label: "MagSafe Tutucular",
      href: trBoutiqueProductsPath(boutiqueSlug, { kategori: "magsafe-tutucu" }),
      cta: "Tutucuları Keşfet",
    },
    {
      label: "Kendi Tasarımını Yap",
      href: trBoutiqueProductsPath(boutiqueSlug, { kategori: "ozel-tasarim" }),
      cta: "Tasarıma Başla",
    },
  ];

  return (
    <section className="border-b border-[#E5E5E5] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Koleksiyona Göz At
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {tiles.map((tile) => (
            <Link key={tile.label} href={tile.href} className="group block">
              <TrNewTenantPlaceholderMedia
                label="Ürün görseli"
                dark
                className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
              />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[16px] font-bold text-[#171717]">
                  {tile.label}
                </p>
                <span className="text-[13px] font-semibold text-[#171717] underline underline-offset-4 transition-opacity group-hover:opacity-60">
                  {tile.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
