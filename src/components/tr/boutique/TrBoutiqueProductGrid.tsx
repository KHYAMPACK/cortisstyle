"use client";

import { useMemo } from "react";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { useTrBoutiqueCatalog } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/categories";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrBoutiqueProductGridProps {
  products: TrProduct[];
  boutiqueSlug: string;
  accentColor?: string;
}

function getActiveCategoryLabel(categoryId: string | null): string {
  if (!categoryId) return "Tüm ürünler";
  return (
    TR_BOUTIQUE_CATEGORIES.find((entry) => entry.id === categoryId)?.label ??
    categoryId
  );
}

export function TrBoutiqueProductGrid({
  products,
  boutiqueSlug,
  accentColor = "#C2185B",
}: TrBoutiqueProductGridProps) {
  const { activeCategory, selectCategory } = useTrBoutiqueCatalog();

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  if (products.length === 0) {
    return (
      <p className="px-5 text-[13px] leading-relaxed text-neutral-600 md:px-8">
        Bu butikte henüz ürün yok.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-5 pb-4 md:px-8">
        <h2
          className="text-[15px] font-semibold tracking-[0.08em] text-neutral-900 uppercase md:text-base"
          style={activeCategory ? { color: accentColor } : undefined}
        >
          {getActiveCategoryLabel(activeCategory)}
        </h2>

        {activeCategory ? (
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className="shrink-0 text-[10px] tracking-[0.14em] text-neutral-500 uppercase underline-offset-2 transition-colors hover:text-neutral-900 hover:underline"
          >
            Filtreyi temizle
          </button>
        ) : null}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-[2px] gap-y-0 bg-white md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <TrProductCard
              key={product.id}
              product={product}
              boutiqueSlug={boutiqueSlug}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <p className="px-5 text-[13px] text-neutral-600 md:px-8">
          Bu kategoride ürün bulunamadı.
        </p>
      )}
    </div>
  );
}
