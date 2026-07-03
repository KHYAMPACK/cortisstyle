"use client";

import { motion } from "framer-motion";
import { forwardRef, type KeyboardEvent, type MouseEvent } from "react";
import { resolveItemPurchaseState } from "@/lib/itemPurchaseState";
import type { ResolvedLookItem } from "@/types/look";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const CARD_IDLE_CLASS =
  "border-blueprint-border bg-blueprint-surface hover:border-blueprint-accent";
const CARD_ACTIVE_CLASS =
  "border-blueprint-accent bg-blueprint-selected shadow-[0_0_0_1px_rgba(30,74,133,0.12)]";

const META_LINE_CLASS =
  "text-meta text-[10px] tracking-[0.28em] uppercase";

const LINK_BUTTON_CLASS =
  "border border-blueprint-border bg-white px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] uppercase transition-colors hover:border-jet-black";

interface LookItemCardProps {
  item: ResolvedLookItem;
  isActive: boolean;
  isMetadataRevealed?: boolean;
  onSelect: (itemId: string) => void;
}

const LOCKED_METADATA_BLUR =
  "pointer-events-none select-none blur-[6px] opacity-60";

function PurchaseLinkButton({
  href,
  label,
  tone = "primary",
  onClick,
}: {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`${LINK_BUTTON_CLASS} ${
        tone === "primary"
          ? "text-neutral-900"
          : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {label}
    </a>
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

    const purchaseState = resolveItemPurchaseState(item);
    const isAlternativeOnly = purchaseState === "alternative-only";

    const surfaceClass = isActive ? CARD_ACTIVE_CLASS : CARD_IDLE_CLASS;

    const stopPropagation = (event: MouseEvent<HTMLAnchorElement>) => {
      event.stopPropagation();
    };

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
        ) : null}

        <h3 className="pr-28 font-serif text-sm tracking-[0.06em] text-neutral-900 uppercase md:pr-32 md:text-base">
          {item.name}
        </h3>

        {isMetadataRevealed ? (
          <div className="mt-3 space-y-3">
            {purchaseState === "editorial" ? (
              <p className={`${META_LINE_CLASS} leading-relaxed text-neutral-500`}>
                Status // Out of stock or editorial piece
              </p>
            ) : null}

            {isAlternativeOnly ? (
              <p className={`${META_LINE_CLASS} leading-relaxed text-neutral-500`}>
                Availability // Original unavailable — alternative recommended
              </p>
            ) : null}

            {purchaseState === "shoppable" ? (
              <p className={META_LINE_CLASS}>
                Est. Price // {item.estPriceRange}
              </p>
            ) : null}

            {purchaseState === "shoppable" || isAlternativeOnly ? (
              <div className="flex flex-wrap gap-2">
                {purchaseState === "shoppable" && item.shopUrl.trim() ? (
                  <PurchaseLinkButton
                    href={item.shopUrl}
                    label="Original Purchase"
                    tone="primary"
                    onClick={stopPropagation}
                  />
                ) : null}
                {item.budgetAlternativeUrl.trim() ? (
                  <PurchaseLinkButton
                    href={item.budgetAlternativeUrl}
                    label="Alternative Link"
                    tone={isAlternativeOnly ? "primary" : "secondary"}
                    onClick={stopPropagation}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="flex items-end justify-between gap-4 pt-1">
              <p className="text-meta min-w-0 text-[9px] leading-relaxed tracking-[0.12em] text-neutral-500">
                {item.displayModel ?? item.name}
              </p>
              <p className="shrink-0 text-right font-serif text-[10px] leading-none tracking-[0.16em] text-neutral-400 uppercase">
                {item.brand}
              </p>
            </div>
          </div>
        ) : null}
      </motion.div>
    );
  },
);
