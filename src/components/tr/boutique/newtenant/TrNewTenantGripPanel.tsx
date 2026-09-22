"use client";

import { Check, Hand, Magnet, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { TrBackButton } from "@/components/tr/TrBackButton";
import { TrFavoriteButton } from "@/components/tr/TrFavoriteButton";
import { useTrScopedCart } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import {
  TrNewTenantAccordion,
  TrNewTenantAccordionItem,
} from "@/components/tr/boutique/newtenant/TrNewTenantAccordion";
import { TrNewTenantPlaceholderMedia } from "@/components/tr/boutique/newtenant/newtenantPlaceholder";
import { newtenantBtnPrimary } from "@/components/tr/boutique/newtenant/newtenantTheme";
import { TrNewTenantPdpMarketingPanels } from "@/components/tr/boutique/newtenant/TrNewTenantPdpMarketingPanels";
import { TrNewTenantYouMayAlsoLike } from "@/components/tr/boutique/newtenant/TrNewTenantYouMayAlsoLike";
import { resolveProductColors } from "@/lib/tr/productOptions";
import { trBoutiquePath, trHomePath } from "@/lib/tr/paths";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

/**
 * Standard-grip PDP — structural match for PopSockets' product page
 * (thumbnail rail + main image, title/subtitle/price, color swatches,
 * Add to Cart + favorite, description, then the "How to Use / What is
 * Included / How to Swap / Details and Specs / Compatibility Check"
 * accordions). Copy in the accordions is placeholder — real MagSafe
 * grip mechanics, not fabricated brand claims, but swap for shot
 * photography / final copy once available. Skips PopSockets' rating
 * stars, "In Demand" counter, and cross-sell kit — those would need
 * a real reviews system / bundle data we don't have; not worth
 * faking for a placeholder catalog.
 */
interface TrNewTenantGripPanelProps {
  product: TrProductWithBoutique;
  entry?: "cadde" | "store";
}

export function TrNewTenantGripPanel({
  product,
  entry = "store",
}: TrNewTenantGripPanelProps) {
  const colors = useMemo(() => resolveProductColors(product), [product]);
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name ?? null);
  const cart = useTrScopedCart();
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);
  const inCart = cart.hasItem(product.id, null);

  const backHref =
    entry === "cadde" ? trHomePath() : trBoutiquePath(product.boutique.slug);

  const handleAddToCart = () => {
    if (inCart) return;
    const image = product.images[0] ?? null;
    cart.addItem({
      productId: product.id,
      boutiqueId: product.boutiqueId,
      boutiqueName: product.boutique.name,
      boutiqueSlug: product.boutique.slug,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size: null,
    });
    openAddedSheet({
      productId: product.id,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size: null,
      color: selectedColor,
      boutiqueName: product.boutique.name,
    });
  };

  return (
    <>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <div className="mb-6">
          <TrBackButton fallbackHref={backHref} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-[#F5F5F5]">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <TrNewTenantPlaceholderMedia label="Görsel yakında" className="h-full w-full" />
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#171717] md:text-[32px]">
            {product.title}
          </h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">MagSafe Tutucu</p>
          <p className="mt-4 text-[22px] font-semibold text-[#171717]">
            {formatTryFromKurus(product.priceKurus)}
          </p>

          {colors.length > 0 ? (
            <div className="mt-6 flex items-center gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  aria-label={color.name}
                  aria-pressed={selectedColor === color.name}
                  className="h-9 w-9 rounded-full border-2 transition-transform"
                  style={{
                    background: color.hex,
                    borderColor:
                      selectedColor === color.name ? "#171717" : "#E5E5E5",
                    transform:
                      selectedColor === color.name ? "scale(1.1)" : undefined,
                  }}
                />
              ))}
            </div>
          ) : null}

          <div className="mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={inCart}
              className={`${newtenantBtnPrimary} flex-1 disabled:opacity-60`}
            >
              {inCart ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" strokeWidth={2} /> Sepette
                </span>
              ) : (
                "Sepete Ekle"
              )}
            </button>
            <TrFavoriteButton
              product={product}
              boutiqueSlug={product.boutique.slug}
              boutiqueName={product.boutique.name}
              size="md"
              className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#171717] bg-white shadow-none [&_button]:bg-transparent [&_button]:shadow-none"
            />
          </div>

          {product.description ? (
            <p className="mt-6 text-[14px] leading-relaxed text-[#6B7280]">
              {product.description}
            </p>
          ) : null}

          <TrNewTenantAccordion>
            <TrNewTenantAccordionItem title="Nasıl Kullanılır" defaultOpen>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Magnet className="mt-0.5 h-4 w-4 shrink-0 text-[#171717]" strokeWidth={1.75} />
                  <span>
                    <span className="font-semibold text-[#171717]">Tak, Çıkar — </span>
                    MagSafe mıknatısıyla telefonuna veya kılıfına saniyeler içinde sabitle.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-[#171717]" strokeWidth={1.75} />
                  <span>
                    <span className="font-semibold text-[#171717]">Değiştirilebilir Üst — </span>
                    İleride üstü çıkarıp yeni bir tasarımla değiştirebilirsin.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Hand className="mt-0.5 h-4 w-4 shrink-0 text-[#171717]" strokeWidth={1.75} />
                  <span>
                    <span className="font-semibold text-[#171717]">Katla, Tut — </span>
                    Dışa doğru çıkar, rahatça tut; kullanmadığında katla.
                  </span>
                </li>
              </ul>
            </TrNewTenantAccordionItem>

            <TrNewTenantAccordionItem title="Kutuda Ne Var">
              <ul className="list-disc space-y-1.5 pl-4">
                <li>1x MagSafe telefon tutucu</li>
              </ul>
            </TrNewTenantAccordionItem>

            <TrNewTenantAccordionItem title="Nasıl Değiştirilir">
              <TrNewTenantPlaceholderMedia
                label="Video yakında"
                className="aspect-video w-full rounded-xl"
              />
            </TrNewTenantAccordionItem>

            <TrNewTenantAccordionItem title="Detaylar ve Özellikler">
              <ul className="list-disc space-y-1.5 pl-4">
                <li>MagSafe uyumlu mıknatıslı tutucu ve stand</li>
                <li>Maksimum tutuş ve stand işlevi</li>
                <li>Kablosuz şarj için kolayca çıkarılabilir</li>
                <li>Dikey izleme için stand olarak kullanılabilir</li>
              </ul>
            </TrNewTenantAccordionItem>

            <TrNewTenantAccordionItem title="Uyumluluk">
              <p className="font-semibold text-[#171717]">Uyumlu:</p>
              <ul className="mt-1 list-disc space-y-1.5 pl-4">
                <li>MagSafe uyumlu tüm telefonlar</li>
                <li>MagSafe uyumlu kılıflar</li>
              </ul>
              <p className="mt-4 font-semibold text-[#171717]">Uyumlu Değil:</p>
              <ul className="mt-1 list-disc space-y-1.5 pl-4">
                <li>MagSafe halkası olmayan kılıflar</li>
              </ul>
            </TrNewTenantAccordionItem>
          </TrNewTenantAccordion>
        </div>
      </div>
    </div>

      <TrNewTenantPdpMarketingPanels />
      <TrNewTenantYouMayAlsoLike product={product} />
    </>
  );
}
