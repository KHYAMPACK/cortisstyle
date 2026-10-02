"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import {
  panelFieldClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";

/**
 * The bar above a panel table: "Tabloda arama yapın" and, when the page has filters,
 * a "Filtre" button whose popover holds them (with the number of active ones). One
 * look for Ürünler, Stok, Kategoriler…
 */
export function TrPanelTableToolbar({
  search,
  onSearchChange,
  searchLabel,
  filterCount = 0,
  filters,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  /** Screen-reader name of the search field ("Ürünlerde ara"). */
  searchLabel: string;
  /** Active filters, shown on the button. */
  filterCount?: number;
  /** The popover's content; no Filtre button without it. */
  filters?: ReactNode;
  /** Anything else on the bar's right (a link, a toggle). */
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tabloda arama yapın"
          className={`${panelFieldClass} pl-9`}
          aria-label={searchLabel}
        />
      </div>
      {filters ? (
        <TrPanelPopover
          label="Filtreler"
          panelClassName="w-[19rem] p-4"
          trigger={(props) => (
            <button type="button" {...props} className={`${panelSecondaryBtnClass} gap-2`}>
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Filtre
              {filterCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--panel-accent)] px-1 text-[11px] font-semibold text-white">
                  {filterCount}
                </span>
              ) : null}
            </button>
          )}
        >
          {filters}
        </TrPanelPopover>
      ) : null}
      {children ? <div className="ml-auto flex items-center gap-3">{children}</div> : null}
    </div>
  );
}


/** One filter in a Filtre popover: its title and a dropdown of its options. */
export function TrPanelFilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className={panelLabelClass}>{label}</span>
      <select
        className={panelFieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** "Filtreleri temizle", shown while any filter is on. */
export function TrPanelFilterClear({ active, onClear }: { active: boolean; onClear: () => void }) {
  return active ? (
    <button
      type="button"
      onClick={onClear}
      className="text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
    >
      Filtreleri temizle
    </button>
  ) : null;
}
