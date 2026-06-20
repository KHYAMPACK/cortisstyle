"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";
import { LOCKED_ITEM_RARITY_PLACEHOLDER } from "@/lib/rarity";
import type { ResolvedLookItem } from "@/types/look";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface LookItemCardProps {
  item: ResolvedLookItem;
  isActive: boolean;
  onSelect: (itemId: string) => void;
}

export const LookItemCard = forwardRef<HTMLButtonElement, LookItemCardProps>(
  function LookItemCard({ item, isActive, onSelect }, ref) {
    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={() => onSelect(item.id)}
        animate={{
          scale: isActive ? 1.02 : 1,
          backgroundColor: isActive ? "#fafafa" : "#ffffff",
        }}
        transition={spring}
        className={`relative w-full rounded-sm border px-4 py-4 text-left transition-shadow ${
          isActive
            ? "border-neutral-900 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
            : "border-transparent hover:border-neutral-200"
        }`}
      >
        <span className="absolute top-4 right-4 font-sans text-[10px] tracking-widest text-neutral-400 uppercase md:text-neutral-500">
          Rarity //
          <span className="ml-1 inline-block w-[5.75rem] overflow-hidden text-right blur-[4px] select-none">
            {LOCKED_ITEM_RARITY_PLACEHOLDER}
          </span>
        </span>

        <h3 className="pr-28 font-serif text-sm tracking-[0.06em] text-neutral-900 uppercase md:pr-32 md:text-base">
          {item.name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500 blur-[6px] select-none">
          {item.blurredDescription}
        </p>
      </motion.button>
    );
  },
);
