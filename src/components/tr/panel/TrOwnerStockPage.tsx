"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { fetchOwnerProducts, updateOwnerProduct } from "@/lib/tr/ownerClient";
import {
  trPanelEditProductPath,
  trPanelPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import type { TrProduct } from "@/types/tr-marketplace";

const LOW_STOCK = 2;

function StockBoard({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const setStock = async (product: TrProduct, next: number) => {
    if (next < 0 || savingId) return;
    setSavingId(product.id);
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
        stock: next,
        status: product.status,
      });
      setProducts((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Stok güncellenemedi.",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="stock-loading" label="Stok yükleniyor…" />
      ) : error && products.length === 0 ? (
        <TrPanelFadeIn key="stock-error">
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="stock-ready" className="space-y-4">
          {error ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}
          <p className="text-[12px] text-neutral-600">
            {products.filter((p) => p.status === "available" && p.stock <= LOW_STOCK).length}{" "}
            düşük stok · {products.length} ürün
          </p>
          {products.length === 0 ? (
            <p className="border border-black/10 bg-white px-4 py-8 text-[13px] text-neutral-600">
              Henüz ürün yok.{" "}
              <Link href={trPanelProductsPath()} className="underline">
                Ürün ekle
              </Link>
            </p>
          ) : (
            <TrPanelStagger className="divide-y divide-black/10 border border-black/10 bg-white">
              {products.map((product) => {
                const cover = product.images[0] ?? null;
                const low =
                  product.status === "available" && product.stock <= LOW_STOCK;
                return (
                  <motion.div
                    key={product.id}
                    variants={trPanelStaggerItem}
                    className="flex flex-wrap items-center gap-3 px-3 py-3"
                  >
                    <Link
                      href={trPanelEditProductPath(product.id)}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-neutral-100">
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] text-neutral-900">
                          {product.title}
                        </p>
                        {low ? (
                          <p className="mt-1 text-[11px] tracking-[0.08em] text-amber-700 uppercase">
                            Düşük stok
                          </p>
                        ) : null}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={savingId === product.id || product.stock <= 0}
                        onClick={() => void setStock(product, product.stock - 1)}
                        className="flex h-9 w-9 items-center justify-center border border-black/15 text-[16px] disabled:opacity-40"
                        aria-label="Stok azalt"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center font-serif text-xl tabular-nums">
                        {product.stock}
                      </span>
                      <button
                        type="button"
                        disabled={savingId === product.id}
                        onClick={() => void setStock(product, product.stock + 1)}
                        className="flex h-9 w-9 items-center justify-center border border-black/15 text-[16px] disabled:opacity-40"
                        aria-label="Stok artır"
                      >
                        +
                      </button>
                    </div>
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
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelPath()}
              className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
            >
              ← Ana sayfa
            </Link>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              Stok
            </h2>
            <p className="mt-1 text-[13px] text-neutral-600">
              Envanteri buradan hızlıca güncelleyin.
            </p>
          </div>
          <StockBoard boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
