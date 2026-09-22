import Link from "next/link";
import { Check } from "lucide-react";
import { newtenantBtnPrimary } from "@/components/tr/boutique/newtenant/newtenantTheme";
import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

/**
 * "Meet the grip" showcase — structural match for PopSockets' "Meet
 * the Ultra-Thin Low-Pro Grip" section (product photo + feature
 * checklist + CTA).
 */
interface TrNewTenantFeatureShowcaseProps {
  boutiqueSlug: string;
}

const CHECKLIST = [
  "Kamera çıkıntısının altında kalır",
  "Ergonomik tutuş için özel doku",
  "Dikey izleme için stand olur",
  "MagSafe mıknatısıyla saniyede takılır",
] as const;

export function TrNewTenantFeatureShowcase({
  boutiqueSlug,
}: TrNewTenantFeatureShowcaseProps) {
  return (
    <section className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <TrNewTenantPlaceholderMedia
          label="Ürün detayı"
          className="aspect-square w-full rounded-2xl"
        />
        <div>
          <h2 className="max-w-md text-[26px] font-bold leading-tight tracking-tight text-[#171717] md:text-[32px]">
            Tanışın: MagSafe Tutucu
          </h2>
          <ul className="mt-6 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B8FF3D]">
                  <Check className="h-3.5 w-3.5 text-[#0A0A0A]" strokeWidth={3} />
                </span>
                <span className="text-[14px] text-[#171717]">{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href={trBoutiqueProductsPath(boutiqueSlug, { kategori: "magsafe-tutucu" })}
            className={`${newtenantBtnPrimary} mt-7`}
          >
            Tutucuları Keşfet
          </Link>
        </div>
      </div>
    </section>
  );
}
