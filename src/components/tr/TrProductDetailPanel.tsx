"use client";

import { useMemo, useState } from "react";
import { TrBackButton } from "@/components/tr/TrBackButton";
import { TrMobileBuyBar } from "@/components/tr/TrMobileBuyBar";
import { TrProductColorPicker } from "@/components/tr/TrProductColorPicker";
import { TrProductPurchasePanel } from "@/components/tr/TrProductPurchasePanel";
import { TrProductSizePicker } from "@/components/tr/TrProductSizePicker";
import { TrPurchaseActions } from "@/components/tr/TrPurchaseActions";
import { TrSizeGateSheet } from "@/components/tr/TrSizeGateSheet";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { getTrCategoryLabel } from "@/lib/tr/categories";
import { isTrDemoProduct } from "@/lib/tr/looks/demoCatalog";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import {
  resolveProductColors,
  resolveProductSizes,
} from "@/lib/tr/productOptions";
import { trBoutiquePath, trHomePath } from "@/lib/tr/paths";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import { useTrAddedToCartStore } from "@/store/trAddedToCartStore";
import { useTrCartStore } from "@/store/trCartStore";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrProductDetailPanelProps {
  product: TrProductWithBoutique;
  branded: boolean;
  /** When `"cadde"`, back falls back to /tr; otherwise boutique storefront. */
  entry?: "cadde" | "store";
}

export function TrProductDetailPanel({
  product,
  branded,
  entry = "store",
}: TrProductDetailPanelProps) {
  const sizes = useMemo(() => resolveProductSizes(product), [product]);
  const colors = useMemo(() => resolveProductColors(product), [product]);
  const accent = resolveBoutiqueThemeAccent(product.boutique);
  const categoryLabel = getTrCategoryLabel(product.category);
  const isAvailable = product.status === "available";
  const checkoutEnabled = isTrCheckoutEnabled() || isTrDemoProduct(product);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0]! : null,
  );
  const [selectedColor, setSelectedColor] = useState(
    colors.length === 1 ? colors[0]! : (colors[0] ?? null),
  );
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);

  const addItem = useTrCartStore((state) => state.addItem);
  const openAddedSheet = useTrAddedToCartStore((state) => state.open);

  const sizeRequired = sizes.length > 0;
  const selectionRequired = sizeRequired && !selectedSize;
  const canOrder = isAvailable && (!sizeRequired || Boolean(selectedSize));

  const fromCadde = entry === "cadde";
  const backFallback = fromCadde
    ? trHomePath()
    : trBoutiquePath(product.boutique.slug);
  const backClass = branded
    ? "text-[11px] tracking-[0.12em] text-neutral-600 uppercase transition-colors hover:text-neutral-900"
    : "text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black";

  const addWithSize = (size: string) => {
    setSelectedSize(size);
    setSizeSheetOpen(false);
    const image = getProductCoverImageFor("boutique", product);
    addItem({
      productId: product.id,
      boutiqueId: product.boutiqueId,
      boutiqueName: product.boutique.name,
      boutiqueSlug: product.boutique.slug,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size,
    });
    openAddedSheet({
      productId: product.id,
      title: product.title,
      priceKurus: product.priceKurus,
      image,
      size,
      color: selectedColor?.name ?? null,
      boutiqueName: product.boutique.name,
    });
  };

  return (
    <>
      <div className="pb-24 md:pb-0">
        <TrBackButton fallbackHref={backFallback} className={backClass} />

        {!branded ? (
          <p className="text-meta mt-6 text-[9px] tracking-[0.5em] uppercase">
            [ ÜRÜN ]
          </p>
        ) : null}

        <h1
          className={
            branded
              ? "mt-4 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl"
              : "mt-3 font-serif text-3xl leading-none tracking-[-0.03em] text-neutral-950 md:text-4xl"
          }
        >
          {product.title}
        </h1>

        <p className="mt-4 font-serif text-2xl tracking-[-0.02em] text-brand-primary">
          {formatTryFromKurus(product.priceKurus)}
        </p>

        <TrProductColorPicker
          colors={colors}
          selectedColor={selectedColor}
          onChange={setSelectedColor}
          accentColor={accent}
        />

        <TrProductSizePicker
          sizes={sizes}
          selectedSize={selectedSize}
          onChange={setSelectedSize}
          accentColor={accent}
        />

        <dl
          className={`mt-6 space-y-3 text-[12px] ${
            branded
              ? "border-t border-black/5 pt-6"
              : "border-t border-blueprint-border pt-6"
          }`}
        >
          {!branded ? (
            <div className="flex gap-4">
              <dt className="text-meta w-28 shrink-0 tracking-[0.12em] uppercase">
                Satıcı
              </dt>
              <dd>
                <TrSoftNavLink
                  href={trBoutiquePath(product.boutique.slug)}
                  className="text-jet-black underline underline-offset-2"
                >
                  {product.boutique.name}
                </TrSoftNavLink>
              </dd>
            </div>
          ) : null}
          {product.conditionLabel ? (
            <div className="flex gap-4">
              <dt
                className={
                  branded
                    ? "w-28 shrink-0 text-neutral-500"
                    : "text-meta w-28 shrink-0 tracking-[0.12em] uppercase"
                }
              >
                Durum
              </dt>
              <dd>{product.conditionLabel}</dd>
            </div>
          ) : null}
          {categoryLabel ? (
            <div className="flex gap-4">
              <dt
                className={
                  branded
                    ? "w-28 shrink-0 text-neutral-500"
                    : "text-meta w-28 shrink-0 tracking-[0.12em] uppercase"
                }
              >
                Kategori
              </dt>
              <dd>{categoryLabel}</dd>
            </div>
          ) : null}
          <div className="flex gap-4">
            <dt
              className={
                branded
                  ? "w-28 shrink-0 text-neutral-500"
                  : "text-meta w-28 shrink-0 tracking-[0.12em] uppercase"
              }
            >
              Stok
            </dt>
            <dd>{isAvailable ? "Satışta" : "Satıldı"}</dd>
          </div>
        </dl>

        {product.description ? (
          <div
            className={`mt-6 pt-6 ${
              branded
                ? "border-t border-black/5"
                : "border-t border-blueprint-border"
            }`}
          >
            {!branded ? (
              <p className="text-meta text-[10px] tracking-[0.18em] uppercase">
                Açıklama
              </p>
            ) : (
              <p className="text-[11px] tracking-[0.1em] text-neutral-500 uppercase">
                Açıklama
              </p>
            )}
            <p className="mt-3 text-[13px] leading-relaxed text-neutral-800">
              {product.description}
            </p>
          </div>
        ) : null}

        <TrProductPurchasePanel
          product={product}
          selectedSize={selectedSize}
          selectedColor={selectedColor?.name ?? null}
          canOrder={canOrder}
          selectionRequired={selectionRequired}
          onRequestSelection={() => setSizeSheetOpen(true)}
          className="hidden md:block"
        />

        {checkoutEnabled ? (
          <TrProductPurchasePanel
            product={product}
            selectedSize={selectedSize}
            selectedColor={selectedColor?.name ?? null}
            canOrder={canOrder}
            selectionRequired={selectionRequired}
            onRequestSelection={() => setSizeSheetOpen(true)}
            hideActions
            className="md:hidden"
          />
        ) : null}
      </div>

      {checkoutEnabled && isAvailable ? (
        <TrMobileBuyBar>
          <TrPurchaseActions
            productId={product.id}
            boutiqueId={product.boutiqueId}
            boutiqueName={product.boutique.name}
            boutiqueSlug={product.boutique.slug}
            title={product.title}
            priceKurus={product.priceKurus}
            image={getProductCoverImageFor("boutique", product)}
            size={selectedSize}
            color={selectedColor?.name ?? null}
            status={product.status}
            selectionRequired={selectionRequired}
            onRequestSelection={() => setSizeSheetOpen(true)}
          />
        </TrMobileBuyBar>
      ) : null}

      <TrSizeGateSheet
        open={sizeSheetOpen}
        onClose={() => setSizeSheetOpen(false)}
        sizes={sizes}
        initialSize={selectedSize}
        onConfirm={addWithSize}
      />
    </>
  );
}
