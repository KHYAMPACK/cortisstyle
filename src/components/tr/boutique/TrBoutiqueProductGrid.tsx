"use client";

import { useMemo, useState } from "react";
import { TrBoutiqueCategoryPills } from "@/components/tr/boutique/TrBoutiqueCategoryPills";
import { TrProductCard } from "@/components/tr/TrProductCard";
import { listCategoriesForProducts } from "@/lib/tr/categories";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrBoutiqueProductGridProps {
  products: TrProduct[];
  accentColor?: string;
}

export function TrBoutiqueProductGrid({
  products,
  accentColor,
}: TrBoutiqueProductGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => listCategoriesForProducts(products),
    [products],
  );

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
    <div className="space-y-6">
      <TrBoutiqueCategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onChange={setActiveCategory}
        accentColor={accentColor}
      />

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
