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
import { fetchOwnerProducts } from "@/lib/tr/ownerClient";
import {
  trPanelEditProductPath,
  trPanelNewProductPath,
  trPanelPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct } from "@/types/tr-marketplace";

const STATUS_LABEL: Record<string, string> = {
  available: "Satışta",
  sold: "Satıldı",
  hidden: "Gizli",
};

function ProductList({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              : "Ürünler yüklenemedi.",
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

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="products-loading" label="Ürünler yükleniyor…" />
      ) : error ? (
        <TrPanelFadeIn key="products-error">
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="products-ready" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-neutral-600">
              {products.length} ürün
            </p>
            <Link
              href={trPanelNewProductPath()}
              className="inline-flex min-h-12 items-center rounded-xl bg-[#C2185B] px-5 py-3 text-[15px] font-semibold text-white"
            >
              Yeni ürün
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="border border-black/10 bg-white px-4 py-8 text-[13px] text-neutral-600">
              Henüz ürün yok. İlk ürününüzü ekleyin.
            </p>
          ) : (
            <TrPanelStagger className="divide-y divide-[#F5C6D6] overflow-hidden rounded-2xl border border-[#F5C6D6] bg-white shadow-sm">
              {products.map((product) => {
                const cover = product.images[0] ?? null;
                return (
                  <motion.div key={product.id} variants={trPanelStaggerItem}>
                    <Link
                      href={trPanelEditProductPath(product.id)}
                      className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[#FFF5F8]"
                    >
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#FFE4EE]">
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[17px] font-medium text-neutral-900">
                          {product.title}
                        </p>
                        <p className="mt-1 text-[15px] text-neutral-600">
                          {formatTryFromKurus(product.priceKurus)} · Stok{" "}
                          {product.stock} ·{" "}
                          {STATUS_LABEL[product.status] ?? product.status}
                          {typeof product.compareAtPriceKurus === "number" &&
                          product.compareAtPriceKurus > product.priceKurus
                            ? " · İndirim"
                            : ""}
                        </p>
                      </div>
                    </Link>
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

export function TrOwnerProductListPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Link
                href={trPanelPath()}
                className="inline-block text-[14px] font-medium text-[#C2185B]"
              >
                ← Ana sayfa
              </Link>
              <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#8E0D3F]">
                Ürünler
              </h2>
            </div>
          </div>
          <ProductList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
