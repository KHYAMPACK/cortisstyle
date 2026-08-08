"use client";

import { useEffect, useRef } from "react";
import { useTrBoutiqueProductsOptional } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { useTrScopedCart } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { resolveProductSizes } from "@/lib/tr/productOptions";
import { isProductSizeSellable } from "@/lib/tr/sizeStocks";
import { getTrBoutiqueLocalCartStore } from "@/store/trBoutiqueLocalCartStore";
import { cartLineKey } from "@/types/tr-cart";

/**
 * Keep boutique cart lines honest vs live catalog: refresh price/title,
 * drop sold / OOS / missing products.
 */
export function useTrBoutiqueCartRevalidate(boutiqueSlug: string) {
  const cart = useTrScopedCart();
  const catalog = useTrBoutiqueProductsOptional();
  const lastSig = useRef<string>("");

  useEffect(() => {
    if (!boutiqueSlug || !catalog?.products) return;

    const byId = new Map(catalog.products.map((p) => [p.id, p]));
    const next = [];

    for (const line of cart.items) {
      const product = byId.get(line.productId);
      if (!product || product.status !== "available") continue;

      const sizes = resolveProductSizes(product);
      if (line.size) {
        if (
          !isProductSizeSellable({
            sizes,
            size: line.size,
            sizeStocks: product.sizeStocks,
            unitStock: product.stock,
          })
        ) {
          continue;
        }
      } else if (sizes.length > 0) {
        continue;
      } else if (product.stock <= 0) {
        continue;
      }

      next.push({
        ...line,
        title: product.title,
        priceKurus: product.priceKurus,
        boutiqueId: product.boutiqueId,
        boutiqueName: product.boutique.name,
        boutiqueSlug: product.boutique.slug,
      });
    }

    const sig = next
      .map(
        (line) =>
          `${cartLineKey(line)}:${line.priceKurus}:${line.title}`,
      )
      .join("|");
    const prevSig = cart.items
      .map(
        (line) =>
          `${cartLineKey(line)}:${line.priceKurus}:${line.title}`,
      )
      .join("|");

    if (sig === prevSig || sig === lastSig.current) return;
    lastSig.current = sig;
    getTrBoutiqueLocalCartStore(boutiqueSlug).getState().setItems(next);
  }, [boutiqueSlug, catalog?.products, cart.items]);
}
