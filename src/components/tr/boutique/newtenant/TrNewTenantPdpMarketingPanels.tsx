import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";

/**
 * Alternating image/text marketing panels under the PDP accordions —
 * structural match for PopSockets' "Protected With Pikachu" / "Swap
 * Your Pokémon" / "Strong Enough For Battle" blocks (big headline +
 * short line + large photo, alternating sides, small accent badge).
 * Copy is genuine MagSafe-grip mechanics, not fabricated claims
 * (no "2x stronger magnets" — we don't know real specs); swap the
 * placeholder media for shot photography later.
 */
const PANELS = [
  {
    badge: "MagSafe Uyumlu",
    title: "Her Telefonda Aynı Rahatlık",
    body: "MagSafe mıknatısıyla telefonuna veya MagSafe uyumlu kılıfına güvenle sabitlenir.",
    imageRight: true,
  },
  {
    badge: "Değiştirilebilir",
    title: "Üstünü Değiştir",
    body: "Yakında: üstü çıkar, yeni bir tasarımla veya kendi fotoğrafınla değiştir.",
    imageRight: false,
  },
  {
    badge: "Güçlü Tutuş",
    title: "Tutar, Katlanır, Stand Olur",
    body: "Dışa doğru çıkar, rahatça tut; kullanmadığında katla, dikey izleme için stand olarak kullan.",
    imageRight: true,
  },
] as const;

export function TrNewTenantPdpMarketingPanels() {
  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      {PANELS.map((panel) => (
        <section
          key={panel.title}
          className="grid items-center gap-8 border-t border-[#E5E5E5] py-14 md:grid-cols-2 md:gap-14"
        >
          <div className={panel.imageRight ? "md:order-1" : "md:order-2"}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
              {panel.badge}
            </p>
            <h2 className="mt-2 max-w-md text-[26px] font-bold leading-tight tracking-tight text-[#171717] md:text-[32px]">
              {panel.title}
            </h2>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[#6B7280]">
              {panel.body}
            </p>
          </div>
          <TrNewTenantPlaceholderMedia
            label="Görsel yakında"
            dark
            className={`aspect-[4/3] w-full rounded-2xl ${panel.imageRight ? "md:order-2" : "md:order-1"}`}
          />
        </section>
      ))}
    </div>
  );
}
