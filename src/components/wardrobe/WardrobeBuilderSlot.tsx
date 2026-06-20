"use client";

import Image from "next/image";
import type { WardrobeEquippedItem } from "@/types/wardrobe-builder";

interface WardrobeBuilderSlotProps {
  label: string;
  stackOrder: number;
  alignClass: string;
  assetWrapperClass: string;
  assetBoundsClass: string;
  isAssignable: boolean;
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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/92 backdrop-blur-[1px]">
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
  stackOrder,
  alignClass,
  assetWrapperClass,
  assetBoundsClass,
  isAssignable,
  item,
  isMenuOpen,
  onEmptyClick,
  onActiveClick,
  onSwap,
  onRemove,
}: WardrobeBuilderSlotProps) {
  const isEmpty = item === null;

  const handleClick = () => {
    if (isEmpty) {
      if (!isAssignable) return;
      onEmptyClick();
      return;
    }

    onActiveClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isEmpty && !isAssignable}
      style={{ zIndex: stackOrder }}
      className={`relative flex h-full min-h-0 w-full overflow-visible border border-neutral-100/40 bg-transparent transition-colors ${alignClass} ${
        isEmpty && !isAssignable
          ? "cursor-default opacity-70"
          : "hover:bg-neutral-50/40"
      }`}
      aria-label={
        isEmpty
          ? isAssignable
            ? `Assign item to ${label}`
            : `${label} reserved`
          : `Manage equipped ${item.name}`
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
          <div
            className={`pointer-events-none relative ${assetBoundsClass} ${assetWrapperClass}`}
          >
            <Image
              src={item.image}
              alt={item.name}
              width={item.widthPx}
              height={item.heightPx}
              unoptimized
              style={{
                width: `${item.widthPx}px`,
                height: `${item.heightPx}px`,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
              className="absolute top-1/2 left-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          </div>
          {isMenuOpen && <SlotActionMenu onSwap={onSwap} onRemove={onRemove} />}
        </>
      )}
    </button>
  );
}
