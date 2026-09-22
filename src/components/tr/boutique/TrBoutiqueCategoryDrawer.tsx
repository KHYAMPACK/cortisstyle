"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/fashion/categories";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import { useTrBoutiqueCatalog } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueCategoryDrawerProps {
  boutique: TrBoutiquePublic;
}

function getCategoryLabel(categoryId: string | null): string {
  if (!categoryId) return "Tümü";
  return (
    TR_BOUTIQUE_CATEGORIES.find((entry) => entry.id === categoryId)?.label ??
    categoryId
  );
}

export function TrBoutiqueCategoryDrawer({ boutique }: TrBoutiqueCategoryDrawerProps) {
  const accent = resolveBoutiqueThemeAccent(boutique);
  const {
    categories,
    activeCategory,
    selectCategory: selectCategoryFromContext,
    isDrawerOpen,
    closeDrawer,
  } = useTrBoutiqueCatalog();

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDrawer, isDrawerOpen]);

  const menuItems = [{ id: null, label: "Tümü" }, ...categories];

  const selectCategory = (categoryId: string | null) => {
    closeDrawer();
    selectCategoryFromContext(categoryId);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Menüyü kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/30"
            onClick={closeDrawer}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Kategoriler"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 z-[70] flex h-full w-[min(22rem,88vw)] flex-col border-r border-black/10 bg-[#FFFBFC] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Kapat"
                className="inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white transition-colors hover:border-black/20"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-neutral-900 uppercase">
                Kategoriler
              </p>
              <span className="h-9 w-9" aria-hidden />
            </div>

            <nav className="flex-1 overflow-y-auto">
              <ul>
                {menuItems.map((item) => {
                  const isActive = activeCategory === item.id;
                  return (
                    <li key={item.id ?? "all"}>
                      <button
                        type="button"
                        onClick={() => selectCategory(item.id)}
                        className="flex w-full items-center justify-between border-b border-black/8 px-5 py-4 text-left text-[12px] font-semibold tracking-[0.12em] text-neutral-900 uppercase transition-colors hover:bg-black/[0.03]"
                        style={
                          isActive
                            ? {
                                backgroundColor: `${accent}14`,
                                borderLeft: `3px solid ${accent}`,
                                paddingLeft: "1.0625rem",
                              }
                            : undefined
                        }
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {activeCategory ? (
              <div className="border-t border-black/10 px-5 py-3 text-[10px] tracking-[0.1em] text-neutral-500 uppercase">
                Seçili: {getCategoryLabel(activeCategory)}
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
