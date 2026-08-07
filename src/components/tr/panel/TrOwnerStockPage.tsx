"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelPageTitleClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import { fetchOwnerProducts, updateOwnerProduct } from "@/lib/tr/ownerClient";
import {
  trPanelEditProductPath,
  trPanelPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import { sortProductSizes } from "@/lib/tr/productOptions";
import { sumSizeStocks } from "@/lib/tr/sizeStocks";
import type { TrProduct } from "@/types/tr-marketplace";

const LOW_STOCK = 2;

function sizeQty(product: TrProduct, size: string): number {
  const n = product.sizeStocks?.[size];
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
}

function StockStepper({
  value,
  disabled,
  onDecrease,
  onIncrease,
  label,
}: {
  value: number;
  disabled: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={onDecrease}
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white text-[24px] font-semibold text-neutral-900 disabled:opacity-40"
        aria-label={`${label} azalt`}
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center text-[22px] font-semibold tabular-nums text-neutral-950">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onIncrease}
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white text-[24px] font-semibold text-neutral-900 disabled:opacity-40"
        aria-label={`${label} artır`}
      >
        +
      </button>
    </div>
  );
}

function StockBoard({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerProducts(boutiqueId);
        if (!cancelled) setProducts(result.products);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Stok yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const patchProduct = async (
    product: TrProduct,
    patch: { stock?: number; sizeStocks?: Record<string, number> },
    key: string,
  ) => {
    if (savingKey) return;
    setSavingKey(key);
    setError(null);
    try {
      const updated = await updateOwnerProduct(product.id, {
        title: product.title,
        description: product.description,
        priceTry: product.priceKurus / 100,
        compareAtPriceTry: product.compareAtPriceKurus
          ? product.compareAtPriceKurus / 100
          : null,
        sizes: product.sizes,
        colors: product.colors,
        category: product.category,
        images: product.images,
        marketplaceImages: product.marketplaceImages,
        lifestyleImages: product.lifestyleImages,
        catalogBackgroundId: product.catalogBackgroundId,
        status: product.status,
        stock: patch.stock ?? product.stock,
        sizeStocks: patch.sizeStocks ?? product.sizeStocks,
      });
      setProducts((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Stok güncellenemedi.",
      );
    } finally {
      setSavingKey(null);
    }
  };

  const setTotalStock = (product: TrProduct, next: number) => {
    if (next < 0) return;
    void patchProduct(product, { stock: next }, product.id);
  };

  const setSizeStock = (product: TrProduct, size: string, next: number) => {
    if (next < 0) return;
    const sizes = sortProductSizes(product.sizes);
    const nextStocks: Record<string, number> = {};
    for (const entry of sizes) {
      nextStocks[entry] =
        entry === size ? next : sizeQty(product, entry);
    }
    void patchProduct(
      product,
      {
        sizeStocks: nextStocks,
        stock: sumSizeStocks(nextStocks),
      },
      `${product.id}:${size}`,
    );
  };

  const lowCount = products.filter((p) => {
    if (p.status !== "available") return false;
    if (p.sizes.length > 0) {
      return sortProductSizes(p.sizes).some(
        (size) => sizeQty(p, size) <= LOW_STOCK,
      );
    }
    return p.stock <= LOW_STOCK;
  }).length;

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="stock-loading" label="Stok yükleniyor…" />
      ) : error && products.length === 0 ? (
        <TrPanelFadeIn key="stock-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="stock-ready" className="space-y-5">
          {error ? <p className={panelErrorClass}>{error}</p> : null}

          <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-5 py-4">
            <p className="text-[17px] font-semibold text-neutral-900">
              {lowCount} düşük stok · {products.length} ürün
            </p>
            <p className="mt-1 text-[15px] text-neutral-700">
              Her beden için ayrı stok girin. Toplam otomatik hesaplanır.
            </p>
          </div>

          {products.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz ürün yok.{" "}
              <Link
                href={trPanelProductsPath()}
                className="font-semibold underline"
                style={{ color: "var(--panel-accent-deep)" }}
              >
                Ürün ekle
              </Link>
            </p>
          ) : (
            <TrPanelStagger className="space-y-3">
              {products.map((product) => {
                const cover =
                  getProductCoverImageFor("marketplace", product) ??
                  product.images[0] ??
                  null;
                const sizes = sortProductSizes(product.sizes);
                const hasSizes = sizes.length > 0;
                const total = hasSizes
                  ? sizes.reduce((sum, size) => sum + sizeQty(product, size), 0)
                  : product.stock;
                const low = product.status === "available" && total <= LOW_STOCK;
                const outOfStock =
                  product.status === "available" && total === 0;
                const busy = savingKey?.startsWith(product.id) ?? false;

                return (
                  <motion.div
                    key={product.id}
                    variants={trPanelStaggerItem}
                    className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                      outOfStock
                        ? "border-neutral-300"
                        : "border-[color:var(--panel-accent-border)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Link
                        href={trPanelEditProductPath(product.id)}
                        className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)]"
                      >
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            unoptimized
                            className="object-contain p-2"
                            sizes="64px"
                          />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[19px] leading-snug font-semibold text-neutral-900">
                          {product.title}
                        </p>
                        {outOfStock ? (
                          <p className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-semibold text-neutral-600">
                            Stokta yok
                          </p>
                        ) : low ? (
                          <p className="text-[14px] font-semibold text-neutral-700">
                            Düşük stok — dikkat
                          </p>
                        ) : null}
                        <p className="text-[15px] text-neutral-600">
                          Toplam:{" "}
                          <span className="font-semibold text-neutral-900">
                            {total}
                          </span>
                          {hasSizes ? " adet (tüm bedenler)" : " adet"}
                        </p>
                        <Link
                          href={trPanelEditProductPath(product.id)}
                          className="inline-block text-[15px] font-medium text-[color:var(--panel-accent-deep)]"
                        >
                          Ürünü düzenle →
                        </Link>
                      </div>
                    </div>

                    {hasSizes ? (
                      <div className="mt-4 space-y-2 border-t border-[color:var(--panel-accent-border)] pt-4">
                        <p className="text-[16px] font-semibold text-neutral-800">
                          Beden stokları
                        </p>
                        {sizes.map((size) => {
                          const qty = sizeQty(product, size);
                          const sizeLow =
                            product.status === "available" &&
                            qty > 0 &&
                            qty <= LOW_STOCK;
                          const empty = qty === 0;
                          return (
                            <div
                              key={size}
                              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 ${
                                empty
                                  ? "bg-neutral-100"
                                  : "bg-[color:var(--panel-accent-soft)]"
                              }`}
                            >
                              <div>
                                <p className="text-[18px] font-semibold text-neutral-900">
                                  {size}
                                </p>
                                <p
                                  className={`text-[14px] ${
                                    empty
                                      ? "font-medium text-neutral-500"
                                      : "text-neutral-600"
                                  }`}
                                >
                                  {empty
                                    ? "Stokta yok"
                                    : sizeLow
                                      ? "Az kaldı"
                                      : "Stokta"}
                                </p>
                              </div>
                              <StockStepper
                                value={qty}
                                disabled={busy}
                                label={`${product.title} ${size}`}
                                onDecrease={() =>
                                  setSizeStock(product, size, qty - 1)
                                }
                                onIncrease={() =>
                                  setSizeStock(product, size, qty + 1)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[color:var(--panel-accent-border)] pt-4">
                        <p className="text-[16px] font-semibold text-neutral-800">
                          Toplam stok
                        </p>
                        <StockStepper
                          value={product.stock}
                          disabled={busy}
                          label={product.title}
                          onDecrease={() =>
                            setTotalStock(product, product.stock - 1)
                          }
                          onIncrease={() =>
                            setTotalStock(product, product.stock + 1)
                          }
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </TrPanelStagger>
          )}
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerStockPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Stok</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600">
              Her bedenin stoğunu ayrı ayrı ayarlayın.
            </p>
          </div>
          <StockBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
