"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

/** A table column header that sorts when clicked; shows which way the column is sorted. */
export function TrPanelSortHeader({
  label,
  active,
  direction,
  onSort,
}: {
  label: string;
  /** This column is the one the table is sorted by. */
  active: boolean;
  direction: "asc" | "desc";
  onSort: () => void;
}) {
  const Icon = !active
    ? ChevronsUpDown
    : direction === "asc"
      ? ChevronUp
      : ChevronDown;
  return (
    <button
      type="button"
      onClick={onSort}
      aria-label={`${label} sütununa göre sırala`}
      className={`-mx-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors duration-150 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] ${
        active ? "text-neutral-900" : ""
      }`}
    >
      {label}
      <Icon
        className={`h-3.5 w-3.5 ${active ? "text-[color:var(--panel-accent-deep)]" : "text-neutral-400"}`}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}
