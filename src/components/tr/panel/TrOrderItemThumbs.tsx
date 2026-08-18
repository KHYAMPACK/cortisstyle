"use client";

import Image from "next/image";
import type { TrOrderItem } from "@/types/tr-marketplace";

/** Product thumbnails for packing — list cards and order detail. */
export function TrOrderItemThumbs({
  items,
  size = "md",
  max = 4,
}: {
  items: TrOrderItem[];
  size?: "sm" | "md" | "lg";
  /** Cap shown on list cards; detail should pass a high max. */
  max?: number;
}) {
  if (items.length === 0) return null;

  const dim =
    size === "sm" ? "h-12 w-12" : size === "lg" ? "h-24 w-20" : "h-16 w-14";
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {visible.map((item) => (
        <li
          key={item.id}
          className={`relative shrink-0 overflow-hidden rounded-xl bg-[color:var(--panel-accent-soft)] ${dim}`}
          title={`${item.title} ×${item.quantity}`}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-contain p-1"
              sizes="96px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-neutral-500">
              {item.title.slice(0, 1)}
            </span>
          )}
          {item.quantity > 1 ? (
            <span className="absolute right-0.5 bottom-0.5 rounded bg-neutral-950/80 px-1 text-[11px] font-semibold text-white">
              ×{item.quantity}
            </span>
          ) : null}
        </li>
      ))}
      {overflow > 0 ? (
        <li className="text-[14px] font-medium text-neutral-600">
          +{overflow} ürün
        </li>
      ) : null}
    </ul>
  );
}
