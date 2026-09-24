"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { panelDesktopSelectClass } from "@/components/tr/panel/panelDesktopUi";

export const PANEL_PAGE_SIZES = [20, 50, 100] as const;

const arrowClass =
  "grid h-8 w-8 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]";

/**
 * Footer of a paginated list: rows per page, "1 - 20 / 135 Sipariş", and page
 * arrows (only when there is more than one page). Pages are client-side.
 */
export function TrPanelListPager({
  page,
  pageCount,
  pageSize,
  total,
  noun,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  /** What the rows are, capitalised as it should read: "Sipariş", "Ürün". */
  noun: string;
  onPage: (next: number) => void;
  onPageSize: (next: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-neutral-600">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          Satır adedi
          <select
            className={panelDesktopSelectClass}
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
          >
            {PANEL_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span className="tabular-nums">
          {from} - {to} / {total} {noun}
        </span>
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={arrowClass}
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className={arrowClass}
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
