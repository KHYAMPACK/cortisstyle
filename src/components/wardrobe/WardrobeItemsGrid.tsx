"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  formatClothingCategoryLabel,
  sortClothingCategories,
} from "@/lib/clothingCategories";
import type { ClothingCategory } from "@/types/item";
import type { WardrobeClothingItem } from "@/types/user";

interface WardrobeItemsGridProps {
  items: WardrobeClothingItem[];
}

export function WardrobeItemsGrid({ items }: WardrobeItemsGridProps) {
  const [activeCategory, setActiveCategory] = useState<ClothingCategory | "all">(
    "all",
  );

  const availableCategories = useMemo(
    () => sortClothingCategories(items.map((item) => item.category)),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  if (items.length === 0) {
    return (
      <p className="text-meta py-16 text-center text-[11px] tracking-[0.25em] uppercase">
        No clothing items yet
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-meta font-mono text-[9px] tracking-[0.35em] uppercase">
          Filter by Category
        </p>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Clothing category filters"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 border px-3 py-2 text-[9px] tracking-[0.28em] uppercase transition-colors ${
              activeCategory === "all"
                ? "border-jet-black bg-jet-black text-white"
                : "border-blueprint-border text-meta hover:border-jet-black hover:text-jet-black"
            }`}
          >
            All
          </button>
          {availableCategories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 border px-3 py-2 text-[9px] tracking-[0.28em] uppercase transition-colors ${
                  isActive
                    ? "border-jet-black bg-jet-black text-white"
                    : "border-blueprint-border text-meta hover:border-jet-black hover:text-jet-black"
                }`}
              >
                {formatClothingCategoryLabel(category)}
              </button>
            );
          })}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-meta py-16 text-center text-[11px] tracking-[0.25em] uppercase">
          No items in this category
        </p>
      ) : (
        <section
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          aria-label="Owned clothing items"
        >
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="surface-canvas-paper flex flex-col border border-blueprint-border"
            >
              <div className="relative aspect-square w-full bg-blueprint-surface/50">
                {item.canvasImage && (
                  <Image
                    src={item.canvasImage}
                    alt={item.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, 20vw"
                    className="object-contain p-3 mix-blend-multiply"
                  />
                )}
              </div>
              <div className="border-t border-blueprint-border px-2 py-3">
                <p className="font-serif text-[9px] leading-snug tracking-[0.1em] text-neutral-900 uppercase md:text-[10px]">
                  {item.name}
                </p>
                <p className="text-meta mt-1 text-[8px] tracking-[0.25em] uppercase">
                  {formatClothingCategoryLabel(item.category)}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
