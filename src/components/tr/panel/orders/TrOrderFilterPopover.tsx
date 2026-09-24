"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  FULFILLMENT_FILTERS,
  FULFILLMENT_LABEL,
  PAYMENT_LABEL,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelChipClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import {
  ORDER_PERIOD_OPTIONS,
  orderFilterCount,
  type OrderListFilters,
} from "@/lib/tr/panel/orderList";
import type { TrPaymentStatus } from "@/types/tr-marketplace";

/** Same chip as the product list's Filtre popover: tighter on desktop. */
const chipClass = (active: boolean) =>
  `${panelChipClass(active)} lg:min-h-0 lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-[13px]`;

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
        <div className="space-y-2">
          <p className={panelLabelClass}>Sipariş durumu</p>
          <div className="flex flex-wrap gap-2">
            {FULFILLMENT_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onChange({ fulfillment: status })}
                className={chipClass(filters.fulfillment === status)}
              >
                {status === "all" ? "Tümü" : FULFILLMENT_LABEL[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className={panelLabelClass}>Ödeme durumu</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ payment: "all" })}
              className={chipClass(filters.payment === "all")}
            >
              Tümü
            </button>
            {paymentStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onChange({ payment: status })}
                className={chipClass(filters.payment === status)}
              >
                {PAYMENT_LABEL[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className={panelLabelClass}>Tarih</p>
          <div className="flex flex-wrap gap-2">
            {ORDER_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ period: option.id })}
                className={chipClass(filters.period === option.id)}
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
