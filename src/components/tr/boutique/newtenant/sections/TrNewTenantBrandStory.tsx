import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

/**
 * Brand-story section — structural match for PopSockets' "Our
 * Founder & Impact" block (2-col text/photo). Adapted copy only:
 * kept to what's actually true for a new tenant (no fabricated sales
 * counts / donation totals — those numbers are PopSockets' own).
 */
interface TrNewTenantBrandStoryProps {
  boutique: TrBoutiquePublic;
}

const VALUE_PROPS = [
  "Sadece MagSafe uyumlu tutuculara odaklanıyoruz",
  "Kendi fotoğrafını veya yazını yükleyip kişiselleştirebilirsin",
  "Türkiye içi hızlı kargo",
] as const;

export function TrNewTenantBrandStory({ boutique }: TrNewTenantBrandStoryProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <div>
          <h2 className="max-w-md text-[26px] font-bold leading-tight tracking-tight text-[#171717] md:text-[32px]">
            Neden {boutique.name}?
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6B7280]">
            {boutique.description?.trim() ||
              "Her telefona uyan, kişiselleştirilebilir MagSafe tutucular tasarlıyoruz."}
          </p>
          <ol className="mt-6 space-y-3">
            {VALUE_PROPS.map((item, i) => (
              <li key={item} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#171717] text-[11px] font-bold text-[#171717]">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[14px] text-[#171717]">{item}</span>
              </li>
            ))}
          </ol>
        </div>
        <TrNewTenantPlaceholderMedia
          label="Marka görseli"
          className="aspect-square w-full rounded-2xl"
        />
      </div>
    </section>
  );
}
