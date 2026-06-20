"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { MatrixCategoryFilter } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";

interface WardrobeSelectionDrawerProps {
  isOpen: boolean;
  categoryFilter: MatrixCategoryFilter | null;
  items: WardrobeClothingItem[];
  equippedItem: WardrobeClothingItem | null;
  onClose: () => void;
  onSelectItem: (item: WardrobeClothingItem) => void;
  onRemoveItem: () => void;
}

export function WardrobeSelectionDrawer({
  isOpen,
  categoryFilter,
  items,
  equippedItem,
  onClose,
  onSelectItem,
  onRemoveItem,
}: WardrobeSelectionDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close selection drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${categoryFilter ?? "item"}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed right-0 bottom-0 left-0 z-[80] max-h-[72vh] border-t border-neutral-200 bg-white shadow-2xl"
          >
            <div className="border-b border-neutral-200 px-5 py-4 md:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] tracking-[0.4em] text-neutral-400 uppercase">
                    Selection Archive
                  </p>
                  <h3 className="mt-1 font-serif text-lg tracking-[-0.01em] text-neutral-950 uppercase">
                    {categoryFilter?.replaceAll("_", " ") ?? "Category"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[10px] tracking-[0.3em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
                >
                  Close
                </button>
              </div>
              {equippedItem ? (
                <div className="mt-4 flex items-center justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[8px] tracking-[0.24em] text-neutral-400 uppercase">
                      Equipped
                    </p>
                    <p className="truncate font-serif text-[10px] tracking-[0.1em] text-neutral-900 uppercase">
                      {equippedItem.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveItem}
                    className="shrink-0 border border-neutral-900 px-3 py-2 font-mono text-[9px] tracking-[0.22em] text-neutral-900 uppercase transition-colors hover:bg-neutral-900 hover:text-white"
                  >
                    Remove Item
                  </button>
                </div>
              ) : null}
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-8">
              {items.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="border border-neutral-200 bg-white text-left transition-colors hover:border-neutral-900"
                    >
                      <div className="relative aspect-square w-full bg-neutral-50">
                        {item.canvasImage ? (
                          <Image
                            src={item.canvasImage}
                            alt={item.name}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-contain p-3 mix-blend-multiply"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center font-mono text-[10px] text-neutral-300">
                            NO ASSET
                          </div>
                        )}
                      </div>
                      <div className="border-t border-neutral-200 px-3 py-3">
                        <p className="font-serif text-[9px] leading-snug tracking-[0.1em] text-neutral-900 uppercase">
                          {item.name}
                        </p>
                        <p className="mt-1 font-mono text-[8px] tracking-[0.2em] text-neutral-500 uppercase">
                          Rarity: {item.rarityScore}/5
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-[10px] tracking-[0.28em] text-neutral-400 uppercase">
                  No items available for this matrix slot
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
