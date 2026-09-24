"use client";

import {
  CircleCheck,
  CircleX,
  Clock,
  PackageCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import {
  FULFILLMENT_HINT,
  fulfillmentHintForBoutique,
} from "@/components/tr/panel/orderFulfillmentUi";
import { TrOrderManualShipment } from "@/components/tr/panel/orders/TrOrderManualShipment";
import { TrOrderProducts } from "@/components/tr/panel/orders/TrOrderProducts";
import { TrOrderStatusMenu } from "@/components/tr/panel/orders/TrOrderStatusMenu";
import { panelCardShellClass, panelHintClass } from "@/components/tr/panel/panelUi";
import { TrOwnerShipmentSection } from "@/components/tr/panel/TrOwnerShipmentSection";
import { fulfillmentCardTitle, orderUnitCount } from "@/lib/tr/panel/orderView";
import type {
  TrFulfillmentStatus,
  TrOrderWithItems,
} from "@/types/tr-marketplace";

const STATUS_ICON: Record<
  TrFulfillmentStatus,
  { Icon: LucideIcon; tile: string }
> = {
  created: { Icon: Clock, tile: "bg-amber-100 text-amber-600" },
  ready: { Icon: PackageCheck, tile: "bg-sky-100 text-sky-600" },
  shipped: { Icon: Truck, tile: "bg-violet-100 text-violet-600" },
  delivered: { Icon: CircleCheck, tile: "bg-emerald-100 text-emerald-600" },
  cancelled: { Icon: CircleX, tile: "bg-neutral-100 text-neutral-500" },
};

/**
 * What is being shipped and where it stands: the products, a way to change the
 * status, and the shipping step — a carrier label for boutiques with a live
 * carrier integration, otherwise the carrier and tracking code entered by hand.
 */
export function TrOrderFulfillmentCard({
  boutiqueId,
  hasCarrierIntegration,
  order,
  busy,
  onStatus,
  onOrder,
}: {
  boutiqueId: string;
  hasCarrierIntegration: boolean;
  order: TrOrderWithItems;
  busy: boolean;
  onStatus: (next: TrFulfillmentStatus) => void;
  onOrder: (order: TrOrderWithItems) => void;
}) {
  const status = order.fulfillmentStatus;
  const { Icon, tile } = STATUS_ICON[status];
  const cancelled = status === "cancelled";

  return (
    <section className={panelCardShellClass}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tile}`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-[16px] font-semibold text-neutral-900">
            {fulfillmentCardTitle(status, orderUnitCount(order))}
          </h2>
        </div>
        {!cancelled ? (
          <TrOrderStatusMenu status={status} disabled={busy} onSelect={onStatus} />
        ) : null}
      </header>

      <TrOrderProducts items={order.items} />

      <div className="border-t border-neutral-100 px-4 py-4 sm:px-6 sm:py-5">
        {cancelled ? (
          <p className={panelHintClass}>{FULFILLMENT_HINT.cancelled}</p>
        ) : hasCarrierIntegration ? (
          <div className="space-y-4">
            <p className={panelHintClass}>
              {fulfillmentHintForBoutique(status, true)}
            </p>
            <TrOwnerShipmentSection
              boutiqueId={boutiqueId}
              order={order}
              onOrder={onOrder}
            />
          </div>
        ) : (
          <TrOrderManualShipment
            boutiqueId={boutiqueId}
            order={order}
            busy={busy}
            onStatus={onStatus}
            onOrder={onOrder}
          />
        )}
      </div>
    </section>
  );
}
