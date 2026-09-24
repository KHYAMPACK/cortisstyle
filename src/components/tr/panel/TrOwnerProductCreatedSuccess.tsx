"use client";

import Image from "next/image";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { motion } from "framer-motion";
import {
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";
import { getPanelProductCover } from "@/lib/tr/productImages";
import {
  trBoutiquePath,
  trBoutiqueProductPath,
  trPanelNewProductPath,
  trPanelProductsPath,
} from "@/lib/tr/paths";
import { formatTryFromKurus, type TrProduct } from "@/types/tr-marketplace";

/**
 * Clear post-create confirmation so owners know the product is live in the store.
 */
export function TrOwnerProductCreatedSuccess({
  product,
  boutiqueSlug,
  boutiqueName,
  onAddAnother,
}: {
  product: TrProduct;
  boutiqueSlug: string;
  boutiqueName: string;
  onAddAnother?: () => void;
}) {
  const cover = getPanelProductCover(product);
  const storeUrl = trBoutiquePath(boutiqueSlug);
  const productUrl = trBoutiqueProductPath(boutiqueSlug, product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={trPanelFadeTransition}
      className="space-y-5"
    >
      <section
        className={`${panelSectionClass} border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white`}
      >
        <p className="text-[15px] font-semibold tracking-wide text-emerald-800 uppercase">
          Başarılı
        </p>
        <h2
          className="mt-2 text-[1.85rem] font-semibold tracking-tight sm:text-[2.1rem]"
          style={{ color: "var(--panel-accent-deep)" }}
        >
          Ürün başarıyla eklendi
        </h2>
        <p className="mt-3 text-[17px] leading-relaxed text-neutral-700">
          <span className="font-semibold text-neutral-900">{product.title}</span>{" "}
          artık mağazanızda satışta. Müşteriler {boutiqueName} vitrininde bunu
          görebilir ve satın alabilir.
        </p>
      </section>

      <section className={panelSectionClass}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-40 w-32 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--panel-accent-soft)] sm:mx-0">
            {cover ? (
              <Image
                src={cover}
                alt={product.title}
                fill
                className="object-contain p-3"
                sizes="128px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[28px] font-semibold text-neutral-400">
                {product.title.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <p className="text-[20px] font-semibold text-neutral-900">
              {product.title}
            </p>
            <p className="text-[22px] font-semibold tabular-nums text-neutral-950">
              {formatTryFromKurus(product.priceKurus)}
            </p>
            <p className={panelHintClass}>
              Durum:{" "}
              <span className="font-semibold text-emerald-800">Satışta</span>
              {product.stock > 0 ? ` · Stok: ${product.stock}` : null}
            </p>
          </div>
        </div>
      </section>

      <section className={`${panelSectionClass} space-y-4`}>
        <p className="text-[18px] font-semibold text-neutral-900">
          Şimdi ne yapmak istersiniz?
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={panelPrimaryBtnClass}
          >
            Mağazada ürünü gör
          </Link>
          <Link
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={panelSecondaryBtnClass}
          >
            Mağaza vitrinini aç
          </Link>
          <Link href={trPanelProductsPath()} className={panelSecondaryBtnClass}>
            Ürün listesine dön
          </Link>
          {onAddAnother ? (
            <button
              type="button"
              onClick={onAddAnother}
              className={panelSecondaryBtnClass}
            >
              + Başka ürün ekle
            </button>
          ) : (
            <Link
              href={trPanelNewProductPath()}
              className={panelSecondaryBtnClass}
            >
              + Başka ürün ekle
            </Link>
          )}
        </div>
        <p className={panelHintClass}>
          İpucu: “Mağazada ürünü gör” müşterinin gördüğü sayfayı yeni sekmede
          açar — eklediğinizi oradan doğrulayabilirsiniz.
        </p>
      </section>
    </motion.div>
  );
}
