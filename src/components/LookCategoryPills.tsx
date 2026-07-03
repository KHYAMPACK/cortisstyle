"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LookCategoryDefinition } from "@/lib/dynamicLooks/types";

interface LookCategoryPillsProps {
  categories: LookCategoryDefinition[];
  /** Element id prefix for each section — pill scrolls to `${sectionIdPrefix}${category.id}`. */
  sectionIdPrefix: string;
  /** Element id of the overall lookbook container (for "ALL" pill). */
  collectionId: string;
}

export function LookCategoryPills({
  categories,
  sectionIdPrefix,
  collectionId,
}: LookCategoryPillsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = categories.map((c) => `${sectionIdPrefix}${c.id}`);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const catId = entry.target.id.replace(sectionIdPrefix, "");
            setActiveId(catId);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [categories, sectionIdPrefix]);

  const scrollTo = useCallback(
    (targetId: string) => {
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  return (
    <nav
      aria-label="Look categories"
      className="sticky top-20 z-30 overflow-x-auto border-b border-blueprint-border bg-ice-floor/90 backdrop-blur-sm"
    >
      <div className="flex gap-1 px-4 py-3 md:px-5">
        <button
          type="button"
          onClick={() => scrollTo(collectionId)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-[9px] tracking-[0.3em] uppercase transition-colors md:text-[10px] ${
            activeId === null
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-blueprint-border text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => scrollTo(`${sectionIdPrefix}${cat.id}`)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-[9px] tracking-[0.3em] uppercase transition-colors md:text-[10px] ${
              activeId === cat.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-blueprint-border text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
