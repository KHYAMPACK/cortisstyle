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
          backgroundColor: isActive ? "#D3E4F5" : "#EBF2FA",
        }}
        transition={spring}
        className={`relative w-full scroll-mt-3 rounded-sm border px-4 py-4 text-left transition-shadow ${
          isActive
            ? "border-blueprint-accent shadow-[0_0_0_1px_rgba(30,74,133,0.12)]"
            : "border-blueprint-border hover:border-blueprint-accent"
        }`}
      >
        {isActive ? (
          <span className="badge-blueprint-active absolute top-4 right-4 px-2 py-1">
            Selected
          </span>
        ) : (
          <span className="text-meta absolute top-4 right-4 text-[10px] tracking-widest uppercase md:text-[10px]">
            Rarity //
            <span className="ml-1 inline-block w-[5.75rem] overflow-hidden text-right blur-[4px] select-none">
              {LOCKED_ITEM_RARITY_PLACEHOLDER}
            </span>
          </span>
        )}

        <h3 className="pr-28 font-serif text-sm tracking-[0.06em] text-neutral-900 uppercase md:pr-32 md:text-base">
          {item.name}
        </h3>
        <p className="text-meta mt-2 text-xs leading-relaxed blur-[6px] select-none">
          {item.blurredDescription}
        </p>
      </motion.button>
    );
  },
);
