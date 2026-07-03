"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { MatrixCategoryFilter } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem } from "@/types/user";

interface WardrobeSelectionDrawerProps {
  isOpen: boolean;
  categoryFilter: MatrixCategoryFilter | null;
  items: WardrobeClothingItem[];
  equippedItem: WardrobeClothingItem | null;
  addClothingHref?: string | null;
  onClose: () => void;
  onSelectItem: (item: WardrobeClothingItem) => void;
  onRemoveItem: () => void;
}

export function WardrobeSelectionDrawer({
  isOpen,
  categoryFilter,
  items,
  equippedItem,
  addClothingHref = null,
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
            className="surface-blueprint fixed right-0 bottom-0 left-0 z-[80] flex max-h-[72vh] flex-col overflow-hidden border-t shadow-2xl"
          >
            <div className="shrink-0 border-b border-blueprint-border px-5 py-4 md:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-meta text-[9px] tracking-[0.4em] uppercase">
                    Selection Archive
                  </p>
                  <h3 className="mt-1 font-serif text-lg tracking-[-0.01em] text-neutral-950 uppercase">
                    {categoryFilter?.replaceAll("_", " ") ?? "Category"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-meta text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-jet-black"
                >
                  Close
                </button>
              </div>
              {equippedItem ? (
                <div className="mt-4 flex items-center justify-between gap-4 border border-blueprint-border bg-blueprint-selected/40 px-4 py-3">
                  <div className="min-w-0">
                    <span className="badge-blueprint-active inline-block px-2 py-1">
                      Equipped
                    </span>
                    <p className="mt-2 truncate font-serif text-[10px] tracking-[0.1em] text-neutral-900 uppercase">
                      {equippedItem.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveItem}
                    className="btn-primary shrink-0 border border-jet-black px-3 py-2 font-mono text-[9px] tracking-[0.22em]"
                  >
                    Remove Item
                  </button>
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8">
              {items.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => {
                    const isEquipped = equippedItem?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className={`border bg-canvas-paper text-left transition-colors ${
                          isEquipped
                            ? "border-blueprint-accent shadow-[0_0_0_1px_rgba(30,74,133,0.12)]"
                            : "border-blueprint-border hover:border-blueprint-accent"
                        }`}
                      >
                        <div className="relative aspect-square w-full bg-blueprint-surface/50">
                          {isEquipped ? (
                            <span className="badge-blueprint-active absolute top-2 left-2 z-10 px-2 py-1">
                              Active
                            </span>
                          ) : null}
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
                            <div className="text-meta flex h-full items-center justify-center text-[10px]">
                              NO ASSET
                            </div>
                          )}
                        </div>
                        <div className="border-t border-blueprint-border px-3 py-3">
                          <p className="font-serif text-[9px] leading-snug tracking-[0.1em] text-neutral-900 uppercase">
                            {item.name}
                          </p>
                          <p className="text-meta mt-1 text-[8px] tracking-[0.2em] uppercase">
                            {item.brand}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-meta max-w-xs text-[10px] leading-relaxed tracking-[0.22em] uppercase">
                    No items in your archive for this slot yet
                  </p>
                  {addClothingHref ? (
                    <Link
                      href={addClothingHref}
                      onClick={onClose}
                      className="btn-primary mt-6 border border-jet-black px-5 py-3 font-mono text-[10px] tracking-[0.3em]"
                    >
                      Add More Clothing
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
