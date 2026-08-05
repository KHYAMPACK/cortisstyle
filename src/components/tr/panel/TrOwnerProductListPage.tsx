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
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
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

const STATUS_TONE: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-900",
  sold: "bg-neutral-100 text-neutral-700",
  hidden: "bg-amber-50 text-amber-950",
};

function ProductList({ boutiqueId }: { boutiqueId: string }) {
  const [products, setProducts] = useState<TrProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(
        "tr-panel-product-delete-notice",
      );
      if (raw) {
        setNotice(raw);
        window.sessionStorage.removeItem("tr-panel-product-delete-notice");
      }
    } catch {
      /* ignore */
    }
  }, []);

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
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="products-ready" className="space-y-5">
          {notice ? (
            <p className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-4 text-[16px] text-amber-950">
              {notice}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[17px] font-medium text-neutral-700">
              {products.length} ürün
            </p>
            <Link
              href={trPanelNewProductPath()}
              className={panelPrimaryBtnClass}
              style={{ backgroundColor: "var(--panel-accent)" }}
            >
              + Yeni ürün ekle
            </Link>
          </div>

          {products.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz ürün yok.
              <br />
              <Link
                href={trPanelNewProductPath()}
                className="mt-3 inline-block font-semibold underline"
                style={{ color: "var(--panel-accent-deep)" }}
              >
                İlk ürününüzü ekleyin
              </Link>
            </p>
          ) : (
            <TrPanelStagger className="space-y-3">
              {products.map((product) => {
                const cover =
                  getProductCoverImageFor("marketplace", product) ??
                  product.images[0] ??
                  null;
                const statusLabel =
                  STATUS_LABEL[product.status] ?? product.status;
                const statusTone =
                  STATUS_TONE[product.status] ?? STATUS_TONE.hidden;
                const onSale =
                  typeof product.compareAtPriceKurus === "number" &&
                  product.compareAtPriceKurus > product.priceKurus;

                return (
                  <motion.div key={product.id} variants={trPanelStaggerItem}>
                    <Link
                      href={trPanelEditProductPath(product.id)}
                      className="flex items-center gap-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm transition-colors hover:bg-[color:var(--panel-accent-soft)] sm:gap-5 sm:p-5"
                    >
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)] sm:h-28 sm:w-24">
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            unoptimized
                            className="object-contain p-2"
                            sizes="96px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-[19px] leading-snug font-semibold text-neutral-900 sm:text-[20px]">
                          {product.title}
                        </p>
                        <p className="text-[18px] font-medium text-neutral-800">
                          {formatTryFromKurus(product.priceKurus)}
                          {onSale ? (
                            <span className="ml-2 text-[15px] font-normal text-neutral-500 line-through">
                              {formatTryFromKurus(product.compareAtPriceKurus!)}
                            </span>
                          ) : null}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[14px] font-semibold ${statusTone}`}
                          >
                            {statusLabel}
                          </span>
                          <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                            Stok: {product.stock}
                          </span>
                          {product.sizes.length > 0 ? (
                            <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                              {product.sizes.join(" · ")}
                            </span>
                          ) : null}
                          {onSale ? (
                            <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-[14px] font-semibold text-rose-800">
                              İndirimli
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[15px] font-medium text-[color:var(--panel-accent-deep)]">
                          Düzenlemek için dokunun →
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
        <div className="space-y-5">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Ürünler</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600">
              Ürünlerinizi buradan görün ve düzenleyin.
            </p>
          </div>
          <ProductList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
