"use client";

import { useMemo } from "react";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { useTrBoutiqueCatalog } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/categories";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrBoutiqueProductGridProps {
  products: TrProduct[];
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
  accentColor = "#C2185B",
}: TrBoutiqueProductGridProps) {
  const { activeCategory, selectCategory } = useTrBoutiqueCatalog();

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  if (products.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Bu butikte henüz ürün yok.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-3">
        <h2
          className="font-serif text-xl tracking-tight text-neutral-900"
          style={activeCategory ? { color: accentColor } : undefined}
        >
          {getActiveCategoryLabel(activeCategory)}
        </h2>

        {activeCategory ? (
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className="shrink-0 border border-black/10 bg-white px-3 py-1.5 text-[10px] tracking-[0.12em] text-neutral-600 uppercase transition-colors hover:border-black/20 hover:text-neutral-900"
          >
            Filtreyi temizle
          </button>
        ) : null}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <TrProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-neutral-600">
          Bu kategoride ürün bulunamadı.
        </p>
      )}
    </div>
  );
}
