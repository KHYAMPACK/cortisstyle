"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  FULFILLMENT_LABEL,
} from "@/components/tr/panel/orderFulfillmentUi";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import type { TrFulfillmentStatus } from "@/types/tr-marketplace";

const SELECTABLE: TrFulfillmentStatus[] = [
  "created",
  "ready",
  "shipped",
  "delivered",
];

/**
 * Sets the fulfilment status directly — for corrections the one-click next-step
 * button doesn't cover (a parcel marked shipped too early, …). Applies at once.
 */
export function TrOrderStatusMenu({
  status,
  disabled,
  onSelect,
}: {
  status: TrFulfillmentStatus;
  disabled: boolean;
  onSelect: (next: TrFulfillmentStatus) => void;
}) {
  return (
    <TrPanelPopover
      label="Sipariş durumu"
      align="end"
      panelClassName="w-48 p-1.5"
      trigger={({ open, ...trigger }) => (
        <button
          type="button"
          {...trigger}
          disabled={disabled}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] disabled:opacity-50 ${
            open ? "bg-neutral-50" : ""
          }`}
        >
          Durumu değiştir
          <ChevronDown
            className={`h-4 w-4 text-neutral-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      )}
    >
      {(close) => (
        <ul>
          {SELECTABLE.map((id) => {
            const current = id === status;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={current}
                  onClick={() => {
                    close();
                    if (!current) onSelect(id);
                  }}
                  className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left text-[13.5px] transition-colors duration-150 ${
                    current
                      ? "bg-[color:var(--panel-accent-soft)] font-semibold text-[color:var(--panel-accent-deep)]"
                      : "font-medium text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {FULFILLMENT_LABEL[id]}
                  {current ? (
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </TrPanelPopover>
  );
}
