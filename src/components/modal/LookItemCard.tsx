"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";
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
        className={`w-full rounded-sm border px-4 py-4 text-left transition-shadow ${
          isActive
            ? "border-neutral-900 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
            : "border-transparent hover:border-neutral-200"
        }`}
      >
        <h3 className="font-serif text-sm tracking-[0.06em] text-neutral-900 uppercase md:text-base">
          {item.name}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500 blur-[6px] select-none">
          {item.blurredDescription}
        </p>
      </motion.button>
    );
  },
);
