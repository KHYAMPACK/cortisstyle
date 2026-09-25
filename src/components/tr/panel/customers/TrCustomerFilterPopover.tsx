"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  panelFilterChipClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import {
  CUSTOMER_ORDERS_OPTIONS,
  customerFilterCount,
  type CustomerListFilters,
} from "@/lib/tr/panel/customerList";
import { ORDER_PERIOD_OPTIONS } from "@/lib/tr/panel/orderList";

/** The Filtre button and its panel: whether they have ordered, and when they were added. */
export function TrCustomerFilterPopover({
  filters,
  onChange,
  onClear,
}: {
  filters: CustomerListFilters;
  onChange: (patch: Partial<CustomerListFilters>) => void;
  onClear: () => void;
}) {
  const count = customerFilterCount(filters);

  return (
    <TrPanelPopover
      label="Filtreler"
      panelClassName="w-[19rem] p-4"
      trigger={({ open, ...trigger }) => (
        <button
          type="button"
          {...trigger}
          className={`${panelSecondaryBtnClass} gap-2 ${open ? "bg-neutral-50" : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Filtre
          {count > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--panel-accent)] px-1 text-[11px] font-semibold text-white">
              {count}
            </span>
          ) : null}
        </button>
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className={panelLabelClass}>Sipariş</p>
          <div className="flex flex-wrap gap-2">
            {CUSTOMER_ORDERS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ orders: option.id })}
                className={panelFilterChipClass(filters.orders === option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className={panelLabelClass}>Oluşturulma tarihi</p>
          <div className="flex flex-wrap gap-2">
            {ORDER_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ period: option.id })}
                className={panelFilterChipClass(filters.period === option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {count > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
          >
            Filtreleri temizle
          </button>
        ) : null}
      </div>
    </TrPanelPopover>
  );
}
