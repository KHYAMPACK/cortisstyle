"use client";

import { ChevronDown } from "lucide-react";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";

export interface OrderBulkMenuItem<Id extends string> {
  id: Id;
  label: string;
  /** How many of the selected orders this applies to; 0 disables the item. */
  count: number;
  /** A rule above this item, to set it apart from the ones before it. */
  dividerBefore?: boolean;
}

/**
 * "N sipariş seçildi" and the Aksiyonlar dropdown, shown in the toolbar while
 * orders are selected. Each item says how many of the selection it will touch.
 */
export function TrOrderBulkMenu<Id extends string>({
  selectedCount,
  items,
  busy,
  onRun,
}: {
  selectedCount: number;
  items: OrderBulkMenuItem<Id>[];
  busy: boolean;
  onRun: (id: Id) => void;
}) {
  return (
    <div className="inline-flex items-stretch gap-0 rounded-lg border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <span className="flex items-center px-3 text-[13px] font-medium text-neutral-800">
        {selectedCount} sipariş seçildi
      </span>
      <TrPanelPopover
        label="Toplu işlemler"
        align="start"
        panelClassName="w-64 p-1.5"
        trigger={({ open, ...trigger }) => (
          <button
            type="button"
            {...trigger}
            disabled={busy}
            className={`inline-flex min-h-9 items-center gap-2 rounded-r-lg border-l border-neutral-200 px-3 text-[13px] font-semibold text-neutral-800 transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--panel-accent-deep)] disabled:opacity-60 ${
              open ? "bg-neutral-50" : ""
            }`}
          >
            {busy ? (
              <>
                <TrPanelBusySpinner />
                İşleniyor…
              </>
            ) : (
              <>
                Aksiyonlar
                <ChevronDown
                  className={`h-4 w-4 text-neutral-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </>
            )}
          </button>
        )}
      >
        {(close) => (
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className={item.dividerBefore ? "mt-1 border-t border-neutral-100 pt-1" : ""}
              >
                <button
                  type="button"
                  disabled={item.count === 0}
                  onClick={() => {
                    close();
                    onRun(item.id);
                  }}
                  className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-[13.5px] font-medium text-neutral-800 transition-colors duration-150 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent"
                >
                  {item.label}
                  <span className="text-[12px] font-normal tabular-nums text-neutral-400">
                    {item.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </TrPanelPopover>
    </div>
  );
}
