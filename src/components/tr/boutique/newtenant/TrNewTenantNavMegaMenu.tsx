import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

/**
 * Hover mega-menu for the "MagSafe Tutucular" nav item — structural
 * match for PopSockets' nav dropdown (link columns + tall promo tiles
 * on the right). Only 2 columns instead of their 3, since this
 * tenant's real taxonomy (collection + color) doesn't stretch to a
 * third without inventing fake categories. Always mounted — `open`
 * drives a fade + slide transition instead of an abrupt mount/unmount
 * so it opens and closes smoothly.
 */
interface TrNewTenantNavMegaMenuProps {
  boutiqueSlug: string;
  open: boolean;
}

const COLLECTION_LINKS = [
  { label: "Tüm Tutucular", kategori: undefined },
  { label: "MagSafe Tutucular", kategori: "magsafe-tutucu" },
  { label: "Kendi Tasarımını Yap", kategori: "ozel-tasarim" },
] as const;

const COLOR_LINKS = [
  { label: "Siyah", hex: "#171717" },
  { label: "Beyaz", hex: "#FFFFFF" },
  { label: "Asit Yeşili", hex: "#B8FF3D" },
] as const;

const TILES = [
  { label: "MagSafe Tutucular", kategori: "magsafe-tutucu" },
  { label: "Kendi Tasarımını Yap", kategori: "ozel-tasarim" },
] as const;

export function TrNewTenantNavMegaMenu({
  boutiqueSlug,
  open,
}: TrNewTenantNavMegaMenuProps) {
  return (
    <div
      className={`absolute inset-x-0 top-full border-t border-[#E5E5E5] bg-white shadow-lg transition-[opacity,transform] duration-200 ease-out ${
        open
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-1 opacity-0"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <Link
          href={trBoutiqueProductsPath(boutiqueSlug, { kategori: "magsafe-tutucu" })}
          className="group inline-flex items-center gap-1 text-[13px] font-bold text-[#171717] transition-opacity hover:opacity-60"
        >
          Tümünü Gör
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={2}
          />
        </Link>

        <div className="mt-6 grid grid-cols-[1fr_1fr_2fr] gap-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
              Koleksiyona Göre
            </p>
            <ul className="mt-3 space-y-2.5">
              {COLLECTION_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={trBoutiqueProductsPath(boutiqueSlug, {
                      kategori: link.kategori,
                    })}
                    className="inline-block text-[13px] text-[#171717] transition-transform duration-150 hover:translate-x-1 hover:opacity-60"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
              Renge Göre
            </p>
            <ul className="mt-3 space-y-2.5">
              {COLOR_LINKS.map((color) => (
                <li key={color.label}>
                  <Link
                    href={trBoutiqueProductsPath(boutiqueSlug, {
                      renk: color.label,
                    })}
                    className="group flex items-center gap-2 text-[13px] text-[#171717] transition-transform duration-150 hover:translate-x-1 hover:opacity-60"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-[#E5E5E5] transition-transform duration-150 group-hover:scale-125"
                      style={{ background: color.hex }}
                    />
                    {color.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {TILES.map((tile) => (
              <Link key={tile.label} href={trBoutiqueProductsPath(boutiqueSlug, { kategori: tile.kategori })} className="group block">
                <div className="overflow-hidden rounded-xl">
                  <TrNewTenantPlaceholderMedia
                    label="Görsel"
                    dark
                    className="aspect-[4/5] w-full transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-[13px] font-bold text-[#171717] transition-opacity group-hover:opacity-60">
                  {tile.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
