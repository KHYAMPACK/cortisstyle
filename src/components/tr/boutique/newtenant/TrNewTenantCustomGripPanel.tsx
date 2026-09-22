"use client";

import { useMemo, useRef, useState } from "react";
import { TrBackButton } from "@/components/tr/TrBackButton";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import {
  newtenantBtnAccent,
} from "@/components/tr/boutique/newtenant/newtenantTheme";
import { TrNewTenantYouMayAlsoLike } from "@/components/tr/boutique/newtenant/TrNewTenantYouMayAlsoLike";
import { trBoutiquePath, trHomePath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrNewTenantCustomGripPanelProps {
  product: TrProductWithBoutique;
  branded: boolean;
  entry?: "cadde" | "store";
}

const RING_COLORS = [
  { id: "black", label: "Siyah", hex: "#171717" },
  { id: "white", label: "Beyaz", hex: "#FFFFFF" },
  { id: "acid", label: "Asit Yeşili", hex: "#B8FF3D" },
] as const;

/**
 * "Kendi Tasarımını Yap" — scaffold only. Mirrors the PopSockets
 * custom-MagSafe-grip tile (photo dropped onto a circular mockup with
 * rotate/zoom/delete affordances) but everything past the client-side
 * preview is a stub: no server upload (the shared
 * /api/tr/customer/upload-reference route is gated to catalogProfile
 * "custom_art", which this tenant is not — see conversation notes),
 * no print-file generation, no cart line. Purchase is intentionally
 * disabled until that pipeline is built.
 *
 * TODO(customizer): wire real upload persistence + positioning state
 * (rotate/zoom/drag) + print-ready file generation + cart/order
 * metadata, then flip the CTA back on.
 */
export function TrNewTenantCustomGripPanel({
  product,
  branded,
  entry = "store",
}: TrNewTenantCustomGripPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [ringColor, setRingColor] = useState<(typeof RING_COLORS)[number]["id"]>(
    "black",
  );

  const backHref =
    entry === "cadde" ? trHomePath() : trBoutiquePath(product.boutique.slug);

  const ring = useMemo(
    () => RING_COLORS.find((c) => c.id === ringColor) ?? RING_COLORS[0],
    [ringColor],
  );

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const wrapperClass = branded
    ? "mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"
    : "";

  return (
    <div className={branded ? "" : "border-b border-[#E5E5E5]"}>
      <div className={wrapperClass}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <TrBackButton fallbackHref={backHref} />
          <TrFavoriteButton product={product} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Live-preview mockup */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#F5F5F5]">
              {/* Grip base */}
              <div
                className="absolute left-1/2 top-1/2 flex h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[10px] shadow-inner"
                style={{ borderColor: ring.hex, background: "#0A0A0A" }}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Yüklenen tasarım önizlemesi"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-6 text-center text-[12px] font-medium text-white/60">
                    Fotoğraf yükle
                  </span>
                )}
                {overlayText.trim() ? (
                  <span className="absolute inset-x-2 bottom-3 truncate text-center text-[13px] font-bold text-white drop-shadow">
                    {overlayText.trim()}
                  </span>
                ) : null}
              </div>

              {/* Non-functional editor affordances — visual only, matches
                  the reference site's custom-grip tile. */}
              <div className="absolute right-4 top-4 flex flex-col gap-2">
                {["Döndür", "Yakınlaştır", "Kaldır"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    title="Yakında"
                    aria-label={label}
                    className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-[#E5E5E5] bg-white/90 text-[11px] text-[#9CA3AF]"
                  >
                    •
                  </button>
                ))}
              </div>

              <span className="absolute left-4 top-4 rounded-full bg-[#B8FF3D] px-3 py-1 text-[11px] font-bold text-[#0A0A0A]">
                Önizleme
              </span>
            </div>

            <p className="mt-3 text-[12px] text-[#6B7280]">
              Bu bir taslak önizlemedir — döndürme/yakınlaştırma ve baskıya
              hazır dosya üretimi henüz aktif değil.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                Kendi Tasarımını Yap
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#171717] md:text-4xl">
                {product.title}
              </h1>
              {product.description ? (
                <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
                  {product.description}
                </p>
              ) : null}
              <p className="mt-4 text-2xl font-semibold tabular-nums text-[#171717]">
                {formatTryFromKurus(product.priceKurus)}
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#171717]">
                1. Fotoğraf yükle
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#171717] bg-white px-6 py-2.5 text-[13px] font-semibold text-[#171717] transition-colors hover:bg-[#171717]/5"
              >
                {previewUrl ? "Fotoğrafı değiştir" : "Fotoğraf seç"}
              </button>
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#171717]">
                2. Yazı ekle (opsiyonel)
              </h2>
              <input
                type="text"
                maxLength={20}
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Örn. isminiz veya kısa bir mesaj"
                className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-[14px] text-[#171717] outline-none focus:border-[#171717]"
              />
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#171717]">
                3. Çerçeve rengi
              </h2>
              <div className="flex items-center gap-3">
                {RING_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setRingColor(c.id)}
                    aria-label={c.label}
                    aria-pressed={ringColor === c.id}
                    className="h-9 w-9 rounded-full border-2 transition-transform"
                    style={{
                      background: c.hex,
                      borderColor: ringColor === c.id ? "#171717" : "#E5E5E5",
                      transform: ringColor === c.id ? "scale(1.1)" : undefined,
                    }}
                  />
                ))}
              </div>
            </section>

            <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4">
              <button
                type="button"
                disabled
                title="Bu ürün için sipariş altyapısı yakında aktif olacak"
                className={`${newtenantBtnAccent} w-full cursor-not-allowed opacity-50`}
              >
                Çok Yakında
              </button>
              <p className="mt-3 text-[12px] leading-relaxed text-[#6B7280]">
                Kişiselleştirilmiş grip siparişi altyapısı hazırlanıyor. Bu
                sayfa şimdilik önizleme amaçlıdır — sipariş alınmıyor.
              </p>
            </div>
          </div>
        </div>
      </div>

      <TrNewTenantYouMayAlsoLike product={product} />
    </div>
  );
}
