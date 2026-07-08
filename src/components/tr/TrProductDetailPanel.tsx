"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TrProductColorPicker } from "@/components/tr/TrProductColorPicker";
import { TrProductPurchasePanel } from "@/components/tr/TrProductPurchasePanel";
import { TrProductSizePicker } from "@/components/tr/TrProductSizePicker";
import { getTrCategoryLabel } from "@/lib/tr/categories";
import {
  resolveProductColors,
  resolveProductSizes,
} from "@/lib/tr/productOptions";
import { trBoutiquePath } from "@/lib/tr/paths";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProductWithBoutique } from "@/types/tr-marketplace";

interface TrProductDetailPanelProps {
  product: TrProductWithBoutique;
  branded: boolean;
}

export function TrProductDetailPanel({ product, branded }: TrProductDetailPanelProps) {
  const sizes = useMemo(() => resolveProductSizes(product), [product]);
  const colors = useMemo(() => resolveProductColors(product), [product]);
  const accent = resolveBoutiqueThemeAccent(product.boutique);
  const categoryLabel = getTrCategoryLabel(product.category);
  const isAvailable = product.status === "available";

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0] : null,
  );
  const [selectedColor, setSelectedColor] = useState(
    colors.length === 1 ? colors[0] : colors[0] ?? null,
  );

  const sizeRequired = sizes.length > 0;
  const canOrder = isAvailable && (!sizeRequired || Boolean(selectedSize));

  return (
    <>
      {branded ? (
        <Link
          href={trBoutiquePath(product.boutique.slug)}
          className="text-[11px] tracking-[0.12em] text-neutral-600 uppercase transition-colors hover:text-neutral-900"
        >
          ← Mağazaya dön
        </Link>
      ) : (
        <>
          <Link
            href={trBoutiquePath(product.boutique.slug)}
            className="text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
          >
            ← {product.boutique.name}
          </Link>
          <p className="text-meta mt-6 text-[9px] tracking-[0.5em] uppercase">[ ÜRÜN ]</p>
        </>
      )}

      <h1
        className={
          branded
            ? "mt-4 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl"
            : "mt-3 font-serif text-3xl leading-none tracking-[-0.03em] text-neutral-950 md:text-4xl"
        }
      >
        {product.title}
      </h1>

      <p className="mt-4 font-serif text-2xl tracking-[-0.02em] text-neutral-950">
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
          branded ? "border-t border-black/5 pt-6" : "border-t border-blueprint-border pt-6"
        }`}
      >
        {!branded ? (
          <div className="flex gap-4">
            <dt className="text-meta w-28 shrink-0 tracking-[0.12em] uppercase">Satıcı</dt>
            <dd>
              <Link
                href={trBoutiquePath(product.boutique.slug)}
                className="text-jet-black underline underline-offset-2"
              >
                {product.boutique.name}
              </Link>
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
            branded ? "border-t border-black/5" : "border-t border-blueprint-border"
          }`}
        >
          {!branded ? (
            <p className="text-meta text-[10px] tracking-[0.18em] uppercase">Açıklama</p>
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

      {!canOrder && isAvailable && sizeRequired ? (
        <p className="mt-6 text-[11px] text-neutral-600">Lütfen beden seçin.</p>
      ) : null}

      <TrProductPurchasePanel
        product={product}
        selectedSize={selectedSize}
        selectedColor={selectedColor?.name ?? null}
        canOrder={canOrder}
      />
    </>
  );
}
