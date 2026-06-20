"use client";

import type { ReactNode } from "react";

interface WardrobeOutfitMoodboardCardProps {
  name: string;
  children: ReactNode;
  showFooter?: boolean;
  /** Shown when `name` is empty — preview defaults to "LOOK NAME". */
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
  const displayName = name.trim() || emptyNameLabel;

  return (
    <div className={containerClassName}>
      {children}

      {showFooter ? (
        <div className="flex items-center justify-between gap-4 py-4">
          <p className="min-w-0 flex-1 truncate pl-1 font-mono text-[11px] tracking-widest text-neutral-800 uppercase">
            {displayName}
          </p>

          <div className="shrink-0 text-right font-mono text-[8px] leading-relaxed tracking-wider text-neutral-400 uppercase">
            <span className="block whitespace-nowrap">made with cortisstyle.com</span>
            <span className="block whitespace-nowrap">@cortisstyle</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
