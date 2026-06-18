"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Look, LookItem } from "@/types/look";
import { CoordinateEditorExport } from "@/components/modal/CoordinateEditorExport";
import { LookItemCard } from "@/components/modal/LookItemCard";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookItemsPanelProps {
  look: Look;
  items: LookItem[];
  activeItemId: string | null;
  isEditMode: boolean;
  onSelectItem: (itemId: string) => void;
}

export function LookItemsPanel({
  look,
  items,
  activeItemId,
  isEditMode,
  onSelectItem,
}: LookItemsPanelProps) {
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (!activeItemId || isEditMode) return;

    const element = itemRefs.current.get(activeItemId);
    element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeItemId, isEditMode]);

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ ...spring, delay: 0.12 }}
      className="flex h-full min-h-0 flex-1 w-full flex-col overflow-hidden border-t border-neutral-200 lg:w-[48%] lg:border-t-0 lg:border-l"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-14 pb-6 md:px-8 md:pt-16 md:pb-8">
        <p className="mb-2 text-[9px] tracking-[0.45em] text-neutral-400 uppercase">
          Styled by
        </p>
        <h2
          id="look-modal-title"
          className="font-serif text-2xl leading-tight tracking-[-0.01em] text-neutral-950 md:text-3xl"
        >
          {look.title}
        </h2>
        <p className="mt-2 text-[10px] tracking-[0.35em] text-neutral-500 uppercase">
          {look.modelName}
        </p>

        <div className="mt-8 space-y-3 border-t border-neutral-200 pt-8">
          {items.map((item) => (
            <LookItemCard
              key={item.id}
              ref={(node) => {
                if (node) {
                  itemRefs.current.set(item.id, node);
                } else {
                  itemRefs.current.delete(item.id);
                }
              }}
              item={item}
              isActive={activeItemId === item.id}
              onSelect={onSelectItem}
            />
          ))}
        </div>

        {isEditMode && <CoordinateEditorExport items={items} />}
      </div>

      <div className="shrink-0 border-t border-neutral-200 bg-white px-6 py-5 md:px-8">
        <Link
          href={look.shopierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full border border-neutral-900 bg-neutral-900 px-6 py-4 text-center text-[10px] tracking-[0.3em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900"
        >
          Unlock Full Style Guide &amp; Shop Links
        </Link>
      </div>
    </motion.aside>
  );
}
