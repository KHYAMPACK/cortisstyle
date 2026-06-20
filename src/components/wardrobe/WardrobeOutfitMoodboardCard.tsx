"use client";

import type { ReactNode } from "react";

const FOOTER_META_CLASS =
  "font-mono text-[9px] tracking-widest text-neutral-400 uppercase";

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
        <div className="flex items-baseline justify-between gap-3 px-1 py-4">
          <span
            className={`min-w-0 flex-1 truncate text-left ${FOOTER_META_CLASS}`}
          >
            {displayName}
          </span>
          <span className={`shrink-0 text-right leading-relaxed ${FOOTER_META_CLASS}`}>
            <span className="block">build your own</span>
            <span className="block">cortisstyle.com</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
