"use client";

import Image from "next/image";
import type { WardrobeEquippedItem } from "@/types/wardrobe-builder";

interface WardrobeBuilderSlotProps {
  label: string;
  item: WardrobeEquippedItem | null;
  isMenuOpen: boolean;
  onEmptyClick: () => void;
  onActiveClick: () => void;
  onSwap: () => void;
  onRemove: () => void;
}

function TechnicalCrosshair() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="relative h-5 w-5 opacity-40">
        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-neutral-300" />
        <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-neutral-300" />
      </div>
    </div>
  );
}

function SlotActionMenu({
  onSwap,
  onRemove,
}: {
  onSwap: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/92 backdrop-blur-[1px]">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSwap();
          }}
          className="border border-neutral-900 bg-white px-4 py-2 font-sans text-[10px] tracking-[0.28em] text-neutral-900 uppercase transition-colors hover:bg-neutral-900 hover:text-white"
        >
          🔄 Swap
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="border border-neutral-300 bg-white px-4 py-2 font-sans text-[10px] tracking-[0.28em] text-neutral-500 uppercase transition-colors hover:border-neutral-900 hover:text-neutral-900"
        >
          ❌ Remove
        </button>
      </div>
    </div>
  );
}

export function WardrobeBuilderSlot({
  label,
  item,
  isMenuOpen,
  onEmptyClick,
  onActiveClick,
  onSwap,
  onRemove,
}: WardrobeBuilderSlotProps) {
  const isEmpty = item === null;

  return (
    <button
      type="button"
      onClick={isEmpty ? onEmptyClick : onActiveClick}
      className="relative flex h-full w-full items-center justify-center overflow-hidden border border-neutral-100 bg-white transition-colors hover:bg-neutral-50/80"
      aria-label={
        isEmpty ? `Assign item to ${label}` : `Manage equipped ${item.name}`
      }
    >
      {isEmpty ? (
        <>
          <TechnicalCrosshair />
          <span
            aria-hidden
            className="font-mono text-lg leading-none font-light text-neutral-200"
          >
            +
          </span>
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-tighter whitespace-nowrap text-neutral-300 uppercase">
            {label}
          </span>
        </>
      ) : (
        <>
          <Image
            src={item.image}
            alt={item.name}
            width={320}
            height={320}
            unoptimized
            className="max-h-full max-w-full object-contain p-2"
          />
          {isMenuOpen && <SlotActionMenu onSwap={onSwap} onRemove={onRemove} />}
        </>
      )}
    </button>
  );
}
