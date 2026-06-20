"use client";

import Image from "next/image";
import type { WardrobeEquippedItem } from "@/types/wardrobe-builder";

interface WardrobeBuilderEquippedAssetProps {
  item: WardrobeEquippedItem;
  isMenuOpen: boolean;
  onActiveClick: () => void;
  onSwap: () => void;
  onRemove: () => void;
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

export function WardrobeBuilderEquippedAsset({
  item,
  isMenuOpen,
  onActiveClick,
  onSwap,
  onRemove,
}: WardrobeBuilderEquippedAssetProps) {
  return (
    <button
      type="button"
      onClick={onActiveClick}
      aria-label={`Manage equipped ${item.name}`}
      className="pointer-events-auto absolute select-none"
      style={{
        top: item.top,
        left: item.left,
        width: item.widthPx,
        zIndex: item.zIndex,
        transform: item.anchorCenter ? "translate(-50%, -50%)" : undefined,
      }}
    >
      <div className="relative leading-[0]">
        <Image
          src={item.image}
          alt={item.name}
          width={1200}
          height={1200}
          unoptimized
          draggable={false}
          sizes={`${Math.ceil(item.widthPx)}px`}
          className="pointer-events-none block h-auto w-full max-w-none select-none object-contain object-left-top"
        />
      </div>
      {isMenuOpen && <SlotActionMenu onSwap={onSwap} onRemove={onRemove} />}
    </button>
  );
}
