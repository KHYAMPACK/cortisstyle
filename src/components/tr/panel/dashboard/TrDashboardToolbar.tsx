"use client";

import NextLink from "next/link";
import { BarChart3, Store } from "lucide-react";
import { TrDashboardDateRange } from "@/components/tr/panel/dashboard/TrDashboardDateRange";
import { panelStickyFilterClass } from "@/components/tr/panel/panelUi";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import type { TrOwnerDashboardQuery } from "@/lib/tr/ownerClient";
import { trPanelReportsPath } from "@/lib/tr/paths";

/** Page title and dashboard controls; stays pinned while the page scrolls. */
export function TrDashboardToolbar({
  query,
  onQueryChange,
  compare,
  onCompareChange,
  storeHref,
}: {
  query: TrOwnerDashboardQuery;
  onQueryChange: (next: TrOwnerDashboardQuery) => void;
  compare: boolean;
  onCompareChange: (next: boolean) => void;
  storeHref: string;
}) {
  return (
    <div className={panelStickyFilterClass}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="mr-auto text-[1.25rem] font-semibold tracking-tight text-neutral-900">
          Giriş
        </h1>

        <TrDashboardDateRange value={query} onChange={onQueryChange} />

        <button
          type="button"
          role="switch"
          aria-checked={compare}
          onClick={() => onCompareChange(!compare)}
          className="group inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-[13px] font-medium text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] lg:min-h-9"
        >
          <span
            aria-hidden
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
              compare
                ? "bg-[color:var(--panel-accent)]"
                : "bg-neutral-300 group-hover:bg-neutral-400"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${
                compare ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
          Önceki döneme göre
        </button>

        <Link
          href={trPanelReportsPath()}
          aria-label="Raporlar"
          title="Raporlar"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors duration-150 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] lg:h-9 lg:w-9"
        >
          <BarChart3 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </Link>

        {/* The mobile header already carries a store link. */}
        <NextLink
          href={storeHref}
          target="_blank"
          rel="noopener"
          prefetch={false}
          className="hidden min-h-9 items-center gap-2 rounded-full bg-[color:var(--panel-accent)] px-4 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[color:var(--panel-accent-hover)] active:bg-[color:var(--panel-accent-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] lg:inline-flex"
        >
          <Store className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Mağazayı aç
        </NextLink>
      </div>
    </div>
  );
}
