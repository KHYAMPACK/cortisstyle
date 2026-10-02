"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  FULFILLMENT_FILTERS,
  FULFILLMENT_LABEL,
  PAYMENT_LABEL,
} from "@/components/tr/panel/orderFulfillmentUi";
import { panelSecondaryBtnClass } from "@/components/tr/panel/panelUi";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import { TrPanelFilterSelect } from "@/components/tr/panel/TrPanelTableToolbar";
import {
  ORDER_PERIOD_OPTIONS,
  orderFilterCount,
  type OrderListFilters,
} from "@/lib/tr/panel/orderList";
import type { TrPaymentStatus } from "@/types/tr-marketplace";

/**
 * The Filtre button and its panel: order status, payment status and period.
 * Only payment statuses that occur in the list are offered.
 */
export function TrOrderFilterPopover({
  filters,
  paymentStatuses,
  onChange,
  onClear,
}: {
  filters: OrderListFilters;
  /** Payment statuses present in the list, in the order they should appear. */
  paymentStatuses: TrPaymentStatus[];
  onChange: (patch: Partial<OrderListFilters>) => void;
  onClear: () => void;
}) {
  const count = orderFilterCount(filters);

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
        <TrPanelFilterSelect
          label="Sipariş durumu"
          options={FULFILLMENT_FILTERS.map((status) => ({
            id: status,
            label: status === "all" ? "Tümü" : FULFILLMENT_LABEL[status],
          }))}
          value={filters.fulfillment}
          onChange={(fulfillment) => onChange({ fulfillment })}
        />
        <TrPanelFilterSelect
          label="Ödeme durumu"
          options={[
            { id: "all" as const, label: "Tümü" },
            ...paymentStatuses.map((status) => ({ id: status, label: PAYMENT_LABEL[status] })),
          ]}
          value={filters.payment}
          onChange={(payment) => onChange({ payment })}
        />
        <TrPanelFilterSelect
          label="Tarih"
          options={ORDER_PERIOD_OPTIONS}
          value={filters.period}
          onChange={(period) => onChange({ period })}
        />

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
