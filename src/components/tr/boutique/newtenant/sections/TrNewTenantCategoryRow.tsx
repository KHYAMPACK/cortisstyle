import Link from "next/link";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

/**
 * Horizontal-scroll circular category row — structural match for
 * PopSockets' "Shop by Collection / Shop by Category" avatar strip.
 * Kept to this tenant's real categories + colors (honest, not a fake
 * 40-collection wall) — swap `hex`/label as the catalog grows.
 */
interface TrNewTenantCategoryRowProps {
  boutiqueSlug: string;
}

const ITEMS = [
  { label: "Tüm Tutucular", kategori: undefined, hex: null },
  { label: "MagSafe Tutucular", kategori: "magsafe-tutucu", hex: null },
  { label: "Kendi Tasarımını Yap", kategori: "ozel-tasarim", hex: null },
  { label: "Siyah", kategori: undefined, hex: "#171717", renk: "Siyah" },
  { label: "Beyaz", kategori: undefined, hex: "#FFFFFF", renk: "Beyaz" },
  { label: "Asit Yeşili", kategori: undefined, hex: "#B8FF3D", renk: "Asit Yeşili" },
] as const;

export function TrNewTenantCategoryRow({
  boutiqueSlug,
}: TrNewTenantCategoryRowProps) {
  return (
    <section className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">
        <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-wide text-[#6B7280]">
          Kategoriye Göre Alışveriş
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {ITEMS.map((item) => (
            <Link
              key={item.label}
              href={trBoutiqueProductsPath(boutiqueSlug, {
                kategori: item.kategori,
                renk: "renk" in item ? item.renk : undefined,
              })}
              className="group flex shrink-0 flex-col items-center gap-2"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform group-hover:scale-105 md:h-20 md:w-20"
                style={{
                  background: item.hex ?? "#F0F0F0",
                  borderColor: item.hex === "#FFFFFF" ? "#E5E5E5" : "transparent",
                }}
              />
              <span className="max-w-[80px] text-center text-[11px] font-medium leading-tight text-[#171717]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
