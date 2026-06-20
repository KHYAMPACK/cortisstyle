"use client";

import type { ReactNode } from "react";

interface WardrobeOutfitMoodboardCardProps {
  name: string;
  children: ReactNode;
  showFooter?: boolean;
  containerClassName?: string;
}

export function WardrobeOutfitMoodboardCard({
  name,
  children,
  showFooter = true,
  containerClassName = "w-full max-w-[420px] shrink-0",
}: WardrobeOutfitMoodboardCardProps) {
  const displayName = name.trim() || "UNTITLED LOOK";

  return (
    <div className={containerClassName}>
      {children}

      {showFooter ? (
        <div className="flex items-end justify-between gap-6 py-4">
          <p className="pl-1 font-mono text-[11px] tracking-widest text-neutral-800 uppercase">
            {displayName}
          </p>

          <div className="flex flex-col items-end font-mono text-[8px] tracking-wider text-neutral-400 uppercase">
            <span>made with cortisstyle.com</span>
            <span>@cortisstyle</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
