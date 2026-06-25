"use client";

import type { ReactNode } from "react";

const FOOTER_META_CLASS =
  "text-meta text-[9px] tracking-widest uppercase";

interface WardrobeOutfitMoodboardCardProps {
  name: string;
  children: ReactNode;
  showFooter?: boolean;
  emptyNameLabel?: string;
  containerClassName?: string;
}

export function WardrobeOutfitMoodboardCard({
  name,
  children,
  showFooter = true,
  emptyNameLabel = "LOOK NAME",
  containerClassName = "w-full max-w-[420px] shrink-0",
}: WardrobeOutfitMoodboardCardProps) {
  const displayName = (name ?? "").trim() || emptyNameLabel;

  return (
    <div className={containerClassName}>
      {children}

      {showFooter ? (
        <div className="flex min-h-[56px] items-end justify-between gap-4 px-1 pt-4 pb-3">
          <span
            className={`min-w-0 flex-1 truncate text-left leading-snug ${FOOTER_META_CLASS}`}
          >
            {displayName}
          </span>
          <span
            className={`shrink-0 text-right leading-snug ${FOOTER_META_CLASS}`}
          >
            <span className="block">build your own</span>
            <span className="block">cortisstyle.com</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
