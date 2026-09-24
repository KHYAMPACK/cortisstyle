"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  useTrScopedCart,
  useTrScopedFavorites,
} from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { useTrBoutiqueProductsOptional } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { TrBoutiqueYouMayAlsoLike } from "@/components/tr/boutique/TrBoutiqueYouMayAlsoLike";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import {
  TrSandboxBanner,
  cartHasDemoItems,
} from "@/components/tr/TrSandboxBanner";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { saveBoutiqueCheckoutSelection } from "@/lib/tr/checkoutSelection";
import { resolveBoutiqueBrandLabel } from "@/lib/tr/boutiqueBrand";
import { useTrBoutiqueCartRevalidate } from "@/lib/tr/useTrBoutiqueCartRevalidate";
import { isCatalogCutoutImage } from "@/lib/tr/productImages";
import {
  trBoutiqueCheckoutPath,
  trBoutiquePath,
  trBoutiqueProductPath,
  trBoutiqueProductsPath,
} from "@/lib/tr/paths";
import {
  pickFavoriteProducts,
  pickRelatedProducts,
} from "@/lib/tr/recommendations";
import { cartLineKey, cartTotalKurus, type TrCartLineItem } from "@/types/tr-cart";
import {
  formatTryFromKurus,
  type TrBoutiquePublic,
  type TrProductWithBoutique,
} from "@/types/tr-marketplace";
import {
  freeShippingProgress,
  quoteCheckoutShippingFee,
  shippingFeeConfigOf,
} from "@/lib/tr/shipping/quoteShipping";
import { useAtelierFabBottomInset } from "@/lib/tr/useAtelierFabBottomInset";
import { TrFreeShippingNudge } from "@/components/tr/commerce/TrFreeShippingNudge";

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
  boutiqueSlug,
  selected,
  onToggle,
  onRemove,
}: {
  item: TrCartLineItem;
  boutiqueSlug: string;
  selected: boolean;
  onToggle: (lineKey: string, next: boolean) => void;
  onRemove: (productId: string, size?: string | null) => void;
}) {
  const cutout =
    !isTrDemoIconSrc(item.image) && isCatalogCutoutImage(item.image);
  const href = trBoutiqueProductPath(boutiqueSlug, item.productId);
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
        href={href}
        className={`relative h-24 w-20 shrink-0 overflow-hidden border border-black/5 sm:h-28 sm:w-24 ${
          cutout || isTrDemoIconSrc(item.image)
            ? "bg-neutral-50"
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
          <span className="flex h-full items-center justify-center px-1 text-center text-[9px] text-neutral-400">
            {item.title}
          </span>
        )}
      </TrSoftNavLink>

      <div className="flex min-w-0 flex-1 flex-col">
        <TrSoftNavLink
          href={href}
          className="line-clamp-2 text-[12px] leading-snug text-neutral-900 sm:text-[13px]"
        >
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

interface TrBoutiqueCartPageContentProps {
  boutique: TrBoutiquePublic;
  catalog?: TrProductWithBoutique[];
  iyzicoCheckout?: boolean;
}

/**
 * Editorial / white-label cart — single-boutique scope.
 */
export function TrBoutiqueCartPageContent({
  boutique,
  catalog: catalogProp,
  iyzicoCheckout = false,
}: TrBoutiqueCartPageContentProps) {
  const cart = useTrScopedCart();
  const favorites = useTrScopedFavorites();
  const boutiqueProducts = useTrBoutiqueProductsOptional();
  const catalog =
    catalogProp ?? boutiqueProducts?.products ?? ([] as TrProductWithBoutique[]);
  const items = cart.items;
  const removeItem = cart.removeItem;
  const demoCart = cartHasDemoItems(items);
  const count = items.length;
  useTrBoutiqueCartRevalidate(boutique.slug);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());
  const stickyBottomRef = useAtelierFabBottomInset();

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
  const shippingConfig = shippingFeeConfigOf(boutique);
  const hasShippingFee = shippingConfig.feeKurus > 0 && !demoCart;
  const shippingFeeKurus =
    hasShippingFee && selectedCount > 0
      ? (quoteCheckoutShippingFee(shippingConfig, selectedItems)?.feeKurus ?? 0)
      : 0;
  const shippingProgress =
    hasShippingFee && selectedCount > 0
      ? freeShippingProgress(shippingConfig, selectedItems)
      : null;
  const shippingShopHref = shippingProgress && !shippingProgress.free
    ? trBoutiqueProductsPath(boutique.slug)
    : undefined;

  const cartIds = useMemo(
    () => items.map((item) => item.productId),
    [items],
  );
  const favoriteIds = useMemo(
    () => favorites.items.map((item) => item.productId),
    [favorites.items],
  );

  const favoriteProducts = useMemo(
    () =>
      pickFavoriteProducts({
        catalog,
        favoriteIds,
        excludeIds: cartIds,
        limit: 8,
      }),
    [catalog, favoriteIds, cartIds],
  );

  const relatedProducts = useMemo(
    () =>
      pickRelatedProducts({
        catalog,
        excludeIds: [...cartIds, ...favoriteProducts.map((p) => p.id)],
        limit: 8,
      }),
    [catalog, cartIds, favoriteProducts],
  );

  const recommendations = (
    <div className={count === 0 ? "pb-16" : "pb-56"}>
      <TrBoutiqueYouMayAlsoLike
        boutique={boutique}
        products={favoriteProducts}
        title="Favorileriniz"
        className={count === 0 ? "" : "mt-14"}
      />
      <TrBoutiqueYouMayAlsoLike
        boutique={boutique}
        products={relatedProducts}
        title="Bunları da beğenebilirsiniz"
        className={favoriteProducts.length > 0 || count === 0 ? "" : "mt-14"}
      />
    </div>
  );

  const toggleItem = (lineKey: string, next: boolean) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(lineKey);
      else copy.delete(lineKey);
      return copy;
    });
  };

  const brandTitle = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);

  if (count === 0) {
    return (
      <div className="pt-6 md:pt-8">
        <div className="mx-auto max-w-3xl px-5 pb-10 md:px-10">
          <p className="mt-10 text-center text-[11px] tracking-[0.22em] text-neutral-500 uppercase">
            Sepetiniz boş
          </p>
          <div className="mt-8 flex justify-center gap-6">
            <TrSoftNavLink
              href={trBoutiquePath(boutique.slug)}
              className="text-[11px] tracking-[0.2em] text-jet-black uppercase underline underline-offset-4"
            >
              Ana sayfa
            </TrSoftNavLink>
            <TrSoftNavLink
              href={trBoutiqueProductsPath(boutique.slug)}
              className="text-[11px] tracking-[0.2em] text-jet-black uppercase underline underline-offset-4"
            >
              Ürünler
            </TrSoftNavLink>
          </div>
        </div>
        {recommendations}
      </div>
    );
  }

  return (
    <div className="flex min-h-[70dvh] flex-col pt-6 md:pt-8">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 md:px-10">
        <TrSandboxBanner className="mb-6" demo={demoCart} iyzicoCheckout={iyzicoCheckout} />

        <p className="mb-4 text-center text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
          {brandTitle} · Sepet · {count} ürün
        </p>

        <ul className="space-y-4">
          <motion.li
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: trPanelEase }}
            className="overflow-hidden border border-black/10 bg-white"
          >
            <ul className="divide-y divide-black/5">
              {items.map((item) => (
                <li key={cartLineKey(item)}>
                  <CartLineRow
                    item={item}
                    boutiqueSlug={boutique.slug}
                    selected={selectedIds.has(cartLineKey(item))}
                    onToggle={toggleItem}
                    onRemove={removeItem}
                  />
                </li>
              ))}
            </ul>
          </motion.li>
        </ul>
      </div>

      {recommendations}
      <div
        ref={stickyBottomRef}
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-neutral-200/80 bg-white/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-3 px-5 py-4 md:px-10 md:py-5">
          {shippingProgress ? (
            <TrFreeShippingNudge
              progress={shippingProgress}
              shopHref={shippingShopHref}
            />
          ) : null}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="text-center sm:text-left">
            <p className="text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
              Sepet özeti
              {selectedCount < count
                ? ` · ${selectedCount}/${count} seçili`
                : ""}
            </p>
            <p className="mt-1 text-[17px] font-semibold tracking-tight text-brand-primary">
              {formatTryFromKurus(
                hasShippingFee ? selectedTotal + shippingFeeKurus : selectedTotal,
              )}
            </p>
            {!hasShippingFee ? (
              <p className="mt-0.5 text-[9px] tracking-[0.12em] text-neutral-400">
                * KDV dahil olmayabilir
              </p>
            ) : selectedCount === 0 ? (
              <p className="mt-0.5 text-[9px] tracking-[0.12em] text-neutral-400">
                Kargo seçili ürünlere göre
              </p>
            ) : null}
          </div>
          {selectedCount > 0 ? (
            <TrSoftNavLink
              href={trBoutiqueCheckoutPath(boutique.slug)}
              onNavigate={() => {
                saveBoutiqueCheckoutSelection(
                  boutique.slug,
                  selectedItems.map((item) => cartLineKey(item)),
                );
              }}
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
    </div>
  );
}
