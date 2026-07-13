"use client";

import Image from "next/image";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { useTrBoutiqueCatalog } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import type { TrFeaturedCategoryTile } from "@/lib/tr/categoryFeatured";

interface TrBoutiqueFeaturedCategoriesProps {
  tiles: TrFeaturedCategoryTile[];
}

function tileLayoutClass(tileCount: number, index: number): string {
  if (tileCount === 1) return "col-span-2 min-h-[100dvh] max-h-[920px]";
  if (tileCount === 2) return "min-h-[50dvh] max-h-[460px]";
  if (tileCount === 3 && index === 2)
    return "col-span-2 min-h-[50dvh] max-h-[460px]";
  return "min-h-[50dvh] max-h-[460px]";
}

export function TrBoutiqueFeaturedCategories({
  tiles,
}: TrBoutiqueFeaturedCategoriesProps) {
  const { selectCategory, closeDrawer, activeCategory } = useTrBoutiqueCatalog();

  if (tiles.length === 0) return null;

  const handleSelect = (categoryId: string) => {
    closeDrawer();
    selectCategory(categoryId);
  };

  return (
    <section
      aria-label="Öne çıkan kategoriler"
      className="grid w-full grid-cols-2 gap-px bg-black/10"
      style={{
        minHeight:
          tiles.length === 1 ? "min(100dvh, 920px)" : "min(100dvh, 920px)",
      }}
    >
      {tiles.map((tile, index) => {
        const isActive = activeCategory === tile.category.id;
        const demoIcon = isTrDemoIconSrc(tile.coverImage);

        return (
          <button
            key={tile.category.id}
            type="button"
            onClick={() => handleSelect(tile.category.id)}
            className={`group relative overflow-hidden bg-neutral-900 text-left transition-opacity hover:opacity-95 ${tileLayoutClass(
              tiles.length,
              index,
            )} ${isActive ? "ring-2 ring-inset ring-[var(--boutique-accent,#C2185B)]" : ""}`}
          >
            {demoIcon ? (
              <div className="absolute inset-0 bg-ice-floor">
                <TrDemoGarmentVisual
                  src={tile.coverImage}
                  iconClassName="h-14 w-14 text-neutral-500 md:h-16 md:w-16"
                />
              </div>
            ) : tile.coverImage ? (
              <Image
                src={tile.coverImage}
                alt=""
                fill
                sizes="50vw"
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                priority={index < 2}
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-300" />
            )}

            <div
              className={`absolute inset-0 ${
                demoIcon
                  ? "bg-gradient-to-t from-black/50 via-transparent to-transparent"
                  : "bg-gradient-to-t from-black/60 via-black/15 to-transparent"
              }`}
            />

            <span className="absolute bottom-6 left-0 w-full px-4 text-center font-sans text-base font-bold tracking-[0.2em] text-white uppercase md:bottom-8 md:text-lg">
              {tile.category.label}
            </span>
          </button>
        );
      })}
    </section>
  );
}
