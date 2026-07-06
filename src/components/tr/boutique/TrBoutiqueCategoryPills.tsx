"use client";

import type { TrCategoryDefinition } from "@/lib/tr/categories";

interface TrBoutiqueCategoryPillsProps {
  categories: TrCategoryDefinition[];
  activeCategory: string | null;
  onChange: (categoryId: string | null) => void;
  accentColor?: string;
}

export function TrBoutiqueCategoryPills({
  categories,
  activeCategory,
  onChange,
  accentColor = "#C2185B",
}: TrBoutiqueCategoryPillsProps) {
  if (categories.length === 0) return null;

  const pillClass = (isActive: boolean) =>
    [
      "shrink-0 rounded-full border px-4 py-2 text-[11px] tracking-[0.08em] transition-colors",
      isActive
        ? "border-transparent text-white"
        : "border-black/10 bg-white/80 text-neutral-700 hover:border-black/20",
    ].join(" ");

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={pillClass(activeCategory === null)}
        style={
          activeCategory === null
            ? { backgroundColor: accentColor }
            : undefined
        }
      >
        Tümü
      </button>

      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={pillClass(isActive)}
            style={isActive ? { backgroundColor: accentColor } : undefined}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
