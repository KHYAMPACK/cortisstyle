"use client";

import { motion } from "framer-motion";
import { TrOrderItemThumbs } from "@/components/tr/panel/TrOrderItemThumbs";
import {
  FULFILLMENT_LABEL,
  FULFILLMENT_TONE,
  formatOrderDateShort,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelEmptyClass,
  panelHintClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  TrPanelListSkeleton,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { useOwnerOrderAlerts } from "@/hooks/useOwnerOrderAlerts";
import { trPanelOrderPath, trPanelOrdersPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

/** The latest orders waiting on the owner, as tappable rows. */
export function TrDashboardRecentOrders({
  boutiqueId,
  offersIyzicoCheckout,
}: {
  boutiqueId: string;
  offersIyzicoCheckout: boolean;
}) {
  const { recentOrders, loading } = useOwnerOrderAlerts(
    boutiqueId,
    offersIyzicoCheckout,
  );

  return (
    <section className={panelSectionClass}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-neutral-900">
            Yeni siparişler
          </h2>
          <p className={`mt-0.5 ${panelHintClass}`}>Detay için dokunun.</p>
        </div>
        <Link
          href={trPanelOrdersPath()}
          className="text-[13px] font-medium text-[color:var(--panel-accent-deep)] hover:underline"
        >
          Tümü
        </Link>
      </div>
      {loading && recentOrders.length === 0 ? (
        <TrPanelListSkeleton rows={3} label="Siparişler yükleniyor" />
      ) : recentOrders.length === 0 ? (
        <p className={panelEmptyClass}>Henüz yeni sipariş yok.</p>
      ) : (
        <TrPanelStagger className="space-y-2">
          {recentOrders.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            return (
              <motion.div key={order.id} variants={trPanelStaggerItem}>
                <Link
                  href={trPanelOrderPath(order.id)}
                  className="block rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-[14px] font-semibold text-neutral-900">
                        {order.customerName}
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        {formatOrderDateShort(order.createdAt)} · {itemCount}{" "}
                        ürün
                      </p>
                      <TrOrderItemThumbs
                        items={order.items}
                        size="sm"
                        max={3}
                      />
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold ${FULFILLMENT_TONE[order.fulfillmentStatus]}`}
                      >
                        {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                      </span>
                    </div>
                    <p className="shrink-0 text-[14px] font-semibold tabular-nums text-neutral-950">
                      {formatTryFromKurus(order.totalKurus)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </TrPanelStagger>
      )}
    </section>
  );
}
