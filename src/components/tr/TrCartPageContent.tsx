"use client";

import Image from "next/image";
import { ChevronRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import {
  TrSandboxBanner,
  cartHasDemoItems,
} from "@/components/tr/TrSandboxBanner";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { TrYouMayAlsoLike } from "@/components/tr/TrYouMayAlsoLike";
import { useTrMarketplaceCache } from "@/components/tr/TrMarketplaceCacheProvider";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { isCatalogCutoutImage } from "@/lib/tr/productImages";
import {
  trBoutiquePath,
  trCheckoutPath,
  trClothPath,
  trHomePath,
  trProductsPath,
} from "@/lib/tr/paths";
import { pickRelatedProducts } from "@/lib/tr/recommendations";
import { useTrCartStore } from "@/store/trCartStore";
import {
  cartLineKey,
  cartTotalKurus,
  groupCartItemsByBoutique,
  type TrCartLineItem,
} from "@/types/tr-cart";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

function CartCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
        checked
          ? "border-brand-primary bg-brand-primary text-white"
          : "border-neutral-300 bg-white text-transparent"
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path
          d="M2 6.2 4.8 9 10 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function CartLineRow({
  item,
  selected,
  onToggle,
  onRemove,
}: {
  item: TrCartLineItem;
  selected: boolean;
  onToggle: (lineKey: string, next: boolean) => void;
  onRemove: (productId: string, size: string | null) => void;
}) {
  const cutout =
    !isTrDemoIconSrc(item.image) && isCatalogCutoutImage(item.image);
  const lineKey = cartLineKey(item);

  return (
    <div
      className={`flex gap-3 px-4 py-4 sm:gap-4 sm:px-5 ${
        selected ? "" : "opacity-55"
      }`}
    >
      <div className="flex shrink-0 items-start pt-1">
        <CartCheckbox
          checked={selected}
          onChange={(next) => onToggle(lineKey, next)}
          label={`${item.title} seç`}
        />
      </div>

      <TrSoftNavLink
        href={trClothPath(item.productId)}
        className={`relative h-24 w-20 shrink-0 overflow-hidden border border-black/5 sm:h-28 sm:w-24 ${
          cutout || isTrDemoIconSrc(item.image)
            ? "bg-ice-floor"
            : "bg-neutral-100"
        }`}
      >
        {isTrDemoIconSrc(item.image) ? (
          <TrDemoGarmentVisual src={item.image} iconClassName="h-9 w-9" />
        ) : item.image ? (
          <Image
            src={item.image}
            alt=""
            fill
            unoptimized
            sizes="96px"
            className={cutout ? "object-contain p-2" : "object-cover"}
          />
        ) : (
          <span className="flex h-full items-center justify-center px-1 text-center text-[9px] text-meta">
            {item.title}
          </span>
        )}
      </TrSoftNavLink>

      <div className="flex min-w-0 flex-1 flex-col">
        <TrSoftNavLink
          href={trClothPath(item.productId)}
          className="line-clamp-2 text-[12px] leading-snug text-neutral-900 sm:text-[13px]"
        >
          <span className="font-semibold tracking-tight">
            {item.boutiqueName}
          </span>{" "}
          <span className="text-neutral-700">{item.title}</span>
        </TrSoftNavLink>

        {item.size ? (
          <p className="mt-1.5 text-[11px] text-neutral-500">
            Beden: <span className="text-neutral-800">{item.size}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-neutral-500">Tek parça</p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onRemove(item.productId, item.size)}
              className="inline-flex items-center gap-1 text-[11px] tracking-[0.08em] text-neutral-500 uppercase transition-colors hover:text-neutral-900"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Sil
            </button>

            <span
              className="inline-flex items-center overflow-hidden border border-black/10 text-[12px] text-neutral-700"
              title="Tek parça ürün"
            >
              <button
                type="button"
                onClick={() => onRemove(item.productId, item.size)}
                aria-label="Kaldır"
                className="px-2.5 py-1.5 transition-colors hover:bg-black/5"
              >
                −
              </button>
              <span
                className="min-w-[1.75rem] bg-brand-primary/10 px-2 py-1.5 text-center font-medium text-brand-primary"
                aria-label="Adet 1"
              >
                1
              </span>
              <span
                className="cursor-default px-2.5 py-1.5 opacity-30"
                aria-hidden
              >
                +
              </span>
            </span>
          </div>

          <p className="text-[15px] font-semibold tracking-tight text-brand-primary sm:text-base">
            {formatTryFromKurus(item.priceKurus)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TrCartPageContent() {
  const items = useTrCartStore((state) => state.items);
  const removeItem = useTrCartStore((state) => state.removeItem);
  const { products: catalog } = useTrMarketplaceCache();
  const demoCart = cartHasDemoItems(items);
  const count = items.length;
  const grouped = useMemo(() => groupCartItemsByBoutique(items), [items]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());

  useLayoutEffect(() => {
    const currentIds = items.map((item) => cartLineKey(item));
    const known = knownIdsRef.current;

    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of currentIds) {
        if (!known.has(id) || prev.has(id)) {
          next.add(id);
        }
      }
      return next;
    });

    knownIdsRef.current = new Set(currentIds);
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(cartLineKey(item))),
    [items, selectedIds],
  );
  const selectedTotal = cartTotalKurus(selectedItems);
  const selectedCount = selectedItems.length;

  const relatedProducts = useMemo(
    () =>
      pickRelatedProducts({
        catalog,
        excludeIds: items.map((item) => item.productId),
        limit: 8,
      }),
    [catalog, items],
  );

  const toggleItem = (lineKey: string, next: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(lineKey);
      else copy.delete(lineKey);
      return copy;
    });
  };

  const toggleBoutique = (productIds: string[], next: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      for (const id of productIds) {
        if (next) copy.add(id);
        else copy.delete(id);
      }
      return copy;
    });
  };

  if (count === 0) {
    return (
      <div className="pt-20 md:pt-24">
        <div className="mx-auto max-w-3xl px-5 pb-10 md:px-10">
          <TrSandboxBanner demo />
          <p className="mt-10 text-center text-[11px] tracking-[0.22em] text-neutral-500 uppercase">
            Sepetiniz boş
          </p>
          <div className="mt-8 flex justify-center gap-6">
            <TrSoftNavLink
              href={trHomePath()}
              className="text-[11px] tracking-[0.2em] text-jet-black uppercase underline underline-offset-4"
            >
              Ana sayfa
            </TrSoftNavLink>
            <TrSoftNavLink
              href={trProductsPath()}
              className="text-[11px] tracking-[0.2em] text-jet-black uppercase underline underline-offset-4"
            >
              Ürünler
            </TrSoftNavLink>
          </div>
        </div>
        <TrYouMayAlsoLike products={relatedProducts} className="pb-16" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pt-20 md:pt-24">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 md:px-10">
        <TrSandboxBanner className="mb-6" demo={demoCart} />

        <p className="mb-4 text-center text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
          Sepet · {count} ürün · {grouped.length} butik
        </p>

        <ul className="space-y-4">
          {grouped.map((group, groupIndex) => {
            const groupIds = group.items.map((item) => cartLineKey(item));
            const allSelected =
              groupIds.length > 0 &&
              groupIds.every((id) => selectedIds.has(id));

            return (
              <motion.li
                key={group.boutiqueId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: trPanelEase,
                  delay: Math.min(groupIndex * 0.05, 0.2),
                }}
                className="overflow-hidden border border-black/10 bg-white"
              >
                <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3 sm:px-5">
                  <CartCheckbox
                    checked={allSelected}
                    onChange={(next) => toggleBoutique(groupIds, next)}
                    label={`${group.boutiqueName} ürünlerini seç`}
                  />
                  <TrSoftNavLink
                    href={trBoutiquePath(group.boutiqueSlug)}
                    className="inline-flex min-w-0 items-center gap-0.5 text-[12px] text-neutral-800 transition-opacity hover:opacity-70"
                  >
                    <span className="text-neutral-500">Satıcı:</span>{" "}
                    <span className="font-semibold text-neutral-950">
                      {group.boutiqueName}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-neutral-400"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </TrSoftNavLink>
                </div>

                <ul className="divide-y divide-black/5">
                  {group.items.map((item) => (
                    <li key={cartLineKey(item)}>
                      <CartLineRow
                        item={item}
                        selected={selectedIds.has(cartLineKey(item))}
                        onToggle={toggleItem}
                        onRemove={removeItem}
                      />
                    </li>
                  ))}
                </ul>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <TrYouMayAlsoLike
        products={relatedProducts}
        className="mt-14 pb-44"
      />

      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-neutral-200/80 bg-ice-floor/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-3 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8 md:px-10 md:py-5">
          <div className="text-center sm:text-left">
            <p className="text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
              Sepet özeti
              {selectedCount < count
                ? ` · ${selectedCount}/${count} seçili`
                : ""}
            </p>
            <p className="mt-1 text-[17px] font-semibold tracking-tight text-brand-primary">
              {formatTryFromKurus(selectedTotal)}
            </p>
            <p className="mt-0.5 text-[9px] tracking-[0.12em] text-neutral-400">
              * KDV dahil olmayabilir
            </p>
          </div>
          {selectedCount > 0 ? (
            <TrSoftNavLink
              href={trCheckoutPath()}
              className="inline-flex min-w-[12rem] items-center justify-center bg-brand-primary px-8 py-3.5 text-[11px] tracking-[0.22em] text-white uppercase transition-colors hover:bg-brand-primary-hover"
            >
              Sepeti onayla ({selectedCount})
            </TrSoftNavLink>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-w-[12rem] cursor-not-allowed items-center justify-center bg-neutral-300 px-8 py-3.5 text-[11px] tracking-[0.22em] text-white uppercase"
            >
              Sepeti onayla (0)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
