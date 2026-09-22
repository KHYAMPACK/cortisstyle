import Link from "next/link";
import { newtenantBtnAccent } from "@/components/tr/boutique/newtenant/newtenantTheme";
import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

/**
 * Full-bleed custom-design banner — structural match for PopSockets'
 * "Your Phone, Your Custom Design" section. Routes straight at this
 * tenant's "Kendi Tasarımını Yap" category.
 */
interface TrNewTenantCustomBannerProps {
  boutiqueSlug: string;
}

export function TrNewTenantCustomBanner({
  boutiqueSlug,
}: TrNewTenantCustomBannerProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <TrNewTenantPlaceholderMedia
          label="Kişiye özel tasarım"
          dark
          className="aspect-square w-full rounded-2xl md:order-2"
        />
        <div className="md:order-1">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Kendi Tasarımını Yap
          </p>
          <h2 className="mt-2 max-w-md text-[28px] font-bold leading-tight tracking-tight text-[#171717] md:text-[36px]">
            Telefonun, Senin Tasarımın
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#6B7280]">
            En sevdiğin fotoğrafı veya kısa bir yazıyı yükle, MagSafe
            tutucunu tamamen kişiselleştir.
          </p>
          <Link
            href={trBoutiqueProductsPath(boutiqueSlug, { kategori: "ozel-tasarim" })}
            className={`${newtenantBtnAccent} mt-6`}
          >
            Tasarıma Başla
          </Link>
        </div>
      </div>
    </section>
  );
}
