"use client";

import { motion } from "framer-motion";
import { forwardRef, type KeyboardEvent } from "react";
import {
  formatItemRarityIndicator,
  LOCKED_ITEM_RARITY_PLACEHOLDER,
} from "@/lib/rarity";
import type { ResolvedLookItem } from "@/types/look";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const CARD_IDLE_CLASS =
  "border-blueprint-border bg-blueprint-surface hover:border-blueprint-accent";
const CARD_ACTIVE_CLASS =
  "border-blueprint-accent bg-blueprint-selected shadow-[0_0_0_1px_rgba(30,74,133,0.12)]";

interface LookItemCardProps {
  item: ResolvedLookItem;
  isActive: boolean;
  isMetadataRevealed?: boolean;
  onSelect: (itemId: string) => void;
}

const LOCKED_METADATA_BLUR =
  "pointer-events-none select-none blur-[6px] opacity-60";

function getLegendaryFrameClass(isActive: boolean): string {
  return isActive
    ? "border-blueprint-accent bg-gradient-to-tr from-white to-[#F8FAFC] shadow-[0_0_30px_rgba(192,213,240,0.65)]"
    : "border-[#B5D1F2] bg-gradient-to-tr from-white to-[#F8FAFC] shadow-[0_0_30px_rgba(192,213,240,0.65)] hover:border-[#9fc0e8]";
}

function LegendaryRarityPulse() {
  return (
    <span className="relative ml-2 flex h-2 w-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3A7BD5] opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3A7BD5]" />
    </span>
  );
}

export const LookItemCard = forwardRef<HTMLDivElement, LookItemCardProps>(
  function LookItemCard(
    { item, isActive, isMetadataRevealed = false, onSelect },
    ref,
  ) {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(item.id);
      }
    };

    const isLegendary = isMetadataRevealed && item.rarityScore === 5;
    const surfaceClass = isLegendary
      ? getLegendaryFrameClass(isActive)
      : isActive
        ? CARD_ACTIVE_CLASS
        : CARD_IDLE_CLASS;

    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(item.id)}
        onKeyDown={handleKeyDown}
        animate={{ scale: isActive ? 1.02 : 1 }}
        transition={spring}
        className={`relative w-full scroll-mt-3 rounded-sm border px-4 py-4 text-left transition-[colors,box-shadow,border-color] duration-200 ${surfaceClass}`}
      >
        {isActive ? (
          <span className="absolute top-4 right-4 border border-blueprint-accent bg-transparent px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-blueprint-accent uppercase">
            Selected
          </span>
        ) : (
          <span
            className={`text-meta absolute top-4 right-4 flex items-center text-[10px] tracking-widest uppercase ${
              isMetadataRevealed ? "" : LOCKED_METADATA_BLUR
            }`}
          >
            {isMetadataRevealed ? (
              <>
                {formatItemRarityIndicator(item.rarityScore)}
                {item.rarityScore === 5 ? <LegendaryRarityPulse /> : null}
              </>
            ) : (
              <>
                Rarity //
                <span className="ml-1 inline-block w-[5.75rem] overflow-hidden text-right">
                  {LOCKED_ITEM_RARITY_PLACEHOLDER}
                </span>
              </>
            )}
          </span>
        )}

        <h3 className="pr-28 font-serif text-sm tracking-[0.06em] text-neutral-900 uppercase md:pr-32 md:text-base">
          {item.name}
        </h3>

        {isMetadataRevealed ? (
          <div className="mt-3 space-y-3">
            <p className="text-meta text-[10px] tracking-[0.28em] uppercase">
              Est. Price // {item.resaleKeywords.estPriceRange}
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href={item.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="border border-blueprint-border bg-white px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] text-neutral-900 uppercase transition-colors hover:border-jet-black"
              >
                Original Purchase
              </a>
              <a
                href={item.budgetAlternativeLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="border border-blueprint-border bg-white px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] text-neutral-600 uppercase transition-colors hover:border-jet-black hover:text-neutral-900"
              >
                Budget Alternative
              </a>
            </div>

            <div className="flex items-end justify-between gap-4 pt-1">
              <p className="text-meta min-w-0 text-[9px] leading-relaxed tracking-[0.12em] text-neutral-500">
                {item.displayModel ?? item.name}
              </p>
              <p className="shrink-0 text-right font-serif text-[10px] leading-none tracking-[0.16em] text-neutral-400 uppercase">
                {item.brand}
              </p>
            </div>
          </div>
        ) : (
          <p className={`text-meta mt-2 text-xs leading-relaxed ${LOCKED_METADATA_BLUR}`}>
            {item.blurredDescription}
          </p>
        )}
      </motion.div>
    );
  },
);
