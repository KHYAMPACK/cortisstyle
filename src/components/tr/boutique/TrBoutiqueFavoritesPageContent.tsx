"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTrScopedFavorites } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { useTrBoutiqueProductsOptional } from "@/components/tr/boutique/TrBoutiqueProductsContext";
import { TrBoutiqueEditorialProductCard } from "@/components/tr/boutique/editorial/TrBoutiqueEditorialProductCard";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import { resolveBoutiqueBrandLabel } from "@/lib/tr/boutiqueBrand";
import { pickFavoriteProducts } from "@/lib/tr/recommendations";
import { trBoutiqueProductsPath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueFavoritesPageContentProps {
  boutique: TrBoutiquePublic;
}

export function TrBoutiqueFavoritesPageContent({
  boutique,
}: TrBoutiqueFavoritesPageContentProps) {
  const favorites = useTrScopedFavorites();
  const boutiqueProducts = useTrBoutiqueProductsOptional();
  const brandTitle = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);
  const productsHref = trBoutiqueProductsPath(boutique.slug);

  const favoriteProducts = useMemo(() => {
    const catalog = boutiqueProducts?.products ?? [];
    return pickFavoriteProducts({
      catalog,
      favoriteIds: favorites.items.map((item) => item.productId),
      limit: 48,
    });
  }, [boutiqueProducts?.products, favorites.items]);

  const count = favorites.hydrated ? favorites.itemCount : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 md:px-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase }}
      >
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-neutral-500">
          {brandTitle}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
          Favoriler
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-neutral-600">
          Beğendiğiniz parçalar burada. Bu mağazaya özeldir.
        </p>
        <p className="mt-2 text-[12px] tracking-[0.08em] text-neutral-500">
          {count} ürün
        </p>
      </motion.div>

      <div className="mt-8">
        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-px bg-black/5 md:grid-cols-3">
            {favoriteProducts.map((product, index) => (
              <div key={product.id} className="bg-white">
                <TrBoutiqueEditorialProductCard
                  product={product}
                  boutiqueSlug={boutique.slug}
                  boutiqueName={boutique.name}
                  priority={index < 4}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-black/10 px-5 py-12 text-center">
            <p className="text-[14px] text-neutral-600">
              Henüz favori ürün yok.
            </p>
            <Link
              href={productsHref}
              className="mt-5 inline-block text-[13px] font-bold tracking-[0.06em] underline underline-offset-4"
            >
              Alışverişe başla
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
