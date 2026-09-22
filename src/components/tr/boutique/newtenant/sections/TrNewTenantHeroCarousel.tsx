"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";

/**
 * Full-bleed rotating hero — structural match for PopSockets' home
 * hero carousel (eyebrow + bold headline + subcopy + single pill CTA,
 * dot pagination, auto-rotate). Slide backgrounds cycle through the
 * tenant's black/white/acid-green palette instead of PopSockets'
 * pastel campaign art.
 */
interface TrNewTenantHeroCarouselProps {
  boutiqueSlug: string;
  boutiqueName: string;
}

export function TrNewTenantHeroCarousel({
  boutiqueSlug,
  boutiqueName,
}: TrNewTenantHeroCarouselProps) {
  const slides = [
    {
      eyebrow: boutiqueName,
      headline: "Her Telefona Uyan MagSafe Tutucu",
      body: "MagSafe mıknatısıyla saniyeler içinde tak, saniyeler içinde çıkar.",
      ctaLabel: "Tutucuları Keşfet",
      href: trBoutiqueProductsPath(boutiqueSlug, { kategori: "magsafe-tutucu" }),
      theme: "dark" as const,
    },
    {
      eyebrow: "Kendi Tasarımını Yap",
      headline: "Kendi Fotoğrafınla Kişiselleştir",
      body: "Fotoğrafını veya yazını yükle, tamamen sana özel bir tutucu tasarla.",
      ctaLabel: "Şimdi Tasarla",
      href: trBoutiqueProductsPath(boutiqueSlug, { kategori: "ozel-tasarim" }),
      theme: "accent" as const,
    },
    {
      eyebrow: "Yeni",
      headline: "İnce Profil. Güçlü Tutuş.",
      body: "Kamera çıkıntısının altında kalan ultra ince MagSafe tasarımı.",
      ctaLabel: "Tüm Tutucular",
      href: trBoutiqueProductsPath(boutiqueSlug),
      theme: "light" as const,
    },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const slide = slides[active]!;
  const isDark = slide.theme === "dark";
  const isAccent = slide.theme === "accent";
  const bgClass = isDark ? "bg-[#0A0A0A]" : isAccent ? "bg-[#B8FF3D]" : "bg-white";
  const textClass = isDark ? "text-white" : "text-[#0A0A0A]";
  const eyebrowClass = isDark
    ? "text-[#B8FF3D]"
    : isAccent
      ? "text-[#0A0A0A]/70"
      : "text-[#6B7280]";
  const ctaClass = isDark
    ? "bg-[#B8FF3D] text-[#0A0A0A] hover:bg-[#A8EF2D]"
    : isAccent
      ? "bg-[#0A0A0A] text-white hover:bg-black"
      : "bg-[#171717] text-white hover:bg-black";

  return (
    <section className={`relative overflow-hidden ${bgClass} ${textClass}`}>
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div className="flex flex-col items-start gap-5">
          <p className={`text-[13px] font-semibold uppercase tracking-wide ${eyebrowClass}`}>
            {slide.eyebrow}
          </p>
          <h1 className="max-w-lg text-[32px] font-bold leading-tight tracking-tight md:text-[44px]">
            {slide.headline}
          </h1>
          <p className="max-w-md text-[15px] opacity-80">{slide.body}</p>
          <Link
            href={slide.href}
            className={`inline-flex min-h-12 items-center justify-center rounded-full px-8 py-3 text-[14px] font-semibold shadow-sm transition-colors ${ctaClass}`}
          >
            {slide.ctaLabel}
          </Link>
        </div>
        <TrNewTenantPlaceholderMedia
          label="Kampanya görseli"
          dark={isDark}
          className="aspect-[4/3] w-full rounded-2xl md:aspect-square"
        />
      </div>

      <div className="mb-6 flex items-center justify-center gap-2 md:absolute md:bottom-6 md:left-1/2 md:mb-0 md:-translate-x-1/2">
        {slides.map((s, i) => (
          <button
            key={s.headline}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Slayt ${i + 1}`}
            aria-current={i === active}
            className={`h-2 rounded-full transition-all ${
              i === active
                ? isDark || isAccent
                  ? "w-6 bg-current"
                  : "w-6 bg-[#171717]"
                : "w-2 bg-current opacity-30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
