"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { TrOrderFulfillmentCard } from "@/components/tr/panel/orders/TrOrderFulfillmentCard";
import { TrOrderCustomerCard } from "@/components/tr/panel/orders/TrOrderCustomerCard";
import {
  TrOrderPaymentCard,
  TrOrderSummaryCard,
} from "@/components/tr/panel/orders/TrOrderSideCards";
import { TrOrderTopActions } from "@/components/tr/panel/orders/TrOrderTopActions";
import { TrOrderTopBadges } from "@/components/tr/panel/orders/TrOrderBadges";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { panelErrorClass, panelSuccessClass } from "@/components/tr/panel/panelUi";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import {
  usePanelBackTarget,
  usePanelSelfPath,
} from "@/components/tr/panel/usePanelOrigin";
import {
  TrPanelPulse,
  trPanelFadeTransition,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerOrder,
  fetchOwnerOrders,
  peekOwnerOrders,
  updateOwnerOrderFulfillment,
  updateOwnerOrderPaymentPaid,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import { orderReference } from "@/lib/tr/orderReference";
import {
  adjacentOrders,
  customerOrderNumber,
  orderPaymentMethod,
} from "@/lib/tr/panel/orderView";
import { boutiqueHasCarrierIntegration } from "@/lib/tr/shipping/registry";
import { withPanelOrigin } from "@/lib/tr/panel/panelOrigin";
import {
  trBoutiquePath,
  trPanelCustomerPath,
  trPanelOrdersPath,
} from "@/lib/tr/paths";
import type {
  TrFulfillmentStatus,
  TrOrderWithItems,
} from "@/types/tr-marketplace";

function OrderSkeleton() {
  return (
    <div
      className="grid gap-4 pt-1 lg:grid-cols-[minmax(0,1fr)_21rem]"
      role="status"
      aria-label="Sipariş yükleniyor"
    >
      <div className="space-y-4">
        <TrPanelPulse className="h-72 w-full" />
        <TrPanelPulse className="h-48 w-full" />
      </div>
      <div className="space-y-4">
        <TrPanelPulse className="h-64 w-full" />
        <TrPanelPulse className="h-44 w-full" />
      </div>
    </div>
  );
}

/**
 * One order, on the shared editor page. The list is cached with every order's
 * items, so an order you reach from the list — or with Önceki / Sonraki — renders
 * at once and is refreshed underneath.
 */
function OrderPage({
  boutique,
  orderId,
}: {
  boutique: TrOwnerBoutiqueSummary;
  orderId: string;
}) {
  const boutiqueId = boutique.id;
  const back = usePanelBackTarget({
    href: trPanelOrdersPath(),
    label: "Siparişler",
  });
  const selfPath = usePanelSelfPath();
  const cachedList = peekOwnerOrders(boutiqueId);
  const [list, setList] = useState<TrOrderWithItems[]>(cachedList ?? []);
  const [order, setOrder] = useState<TrOrderWithItems | null>(
    () => cachedList?.find((entry) => entry.id === orderId) ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelNotice, setCancelNotice] = useState(false);

  const refreshList = useCallback(() => {
    fetchOwnerOrders(boutiqueId).then(setList, () => {
      // Önceki / Sonraki just stay as they were.
    });
  }, [boutiqueId]);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerOrder(boutiqueId, orderId).then(
      (result) => {
        if (!cancelled) setOrder(result);
      },
      (loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Sipariş yüklenemedi.",
        );
      },
    );
    fetchOwnerOrders(boutiqueId).then(
      (result) => {
        if (!cancelled) setList(result);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, orderId]);

  useEffect(() => {
    if (!cancelNotice) return;
    const timer = window.setTimeout(() => setCancelNotice(false), 4000);
    return () => window.clearTimeout(timer);
  }, [cancelNotice]);

  /** An action changed the order: show the new state and keep the list in step. */
  const applyOrder = useCallback(
    (next: TrOrderWithItems) => {
      setOrder(next);
      refreshList();
    },
    [refreshList],
  );

  const runAction = async (
    action: () => Promise<TrOrderWithItems>,
    fallback: string,
  ): Promise<boolean> => {
    if (saving) return false;
    setSaving(true);
    setError(null);
    try {
      applyOrder(await action());
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : fallback);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: TrFulfillmentStatus) => {
    const worked = await runAction(
      () => updateOwnerOrderFulfillment(boutiqueId, orderId, status),
      "Durum güncellenemedi.",
    );
    if (worked && status === "cancelled") setCancelNotice(true);
  };

  const markPaid = () =>
    void runAction(
      () => updateOwnerOrderPaymentPaid(boutiqueId, orderId),
      "Ödeme durumu güncellenemedi.",
    );

  const hasCarrierIntegration = boutiqueHasCarrierIntegration(boutique.slug);
  const neighbours = adjacentOrders(list, orderId);

  const cancelMessage = order
    ? [
        `${order.customerName} siparişi iptal edilecek. Stok geri yüklenir.`,
        hasCarrierIntegration ? "Kargo kaydı da kapatılır." : null,
        orderPaymentMethod(order) === "card"
          ? "Kart iadesi ayrıca yapılmalıdır."
          : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <TrPanelEditor
      backHref={back.href}
      parentLabel={back.label}
      title={`Sipariş #${orderReference(orderId)}`}
      subject={order?.customerName}
      badges={order ? <TrOrderTopBadges order={order} /> : null}
      width="wide"
    >
      {order ? (
        <TrOrderTopActions
          previousId={neighbours.newer?.id ?? null}
          nextId={neighbours.older?.id ?? null}
          closeHref={back.fromElsewhere ? back.href : null}
          cancellable={order.fulfillmentStatus !== "cancelled"}
          cancelling={saving}
          cancelMessage={cancelMessage}
          onCancel={() => void setStatus("cancelled")}
        />
      ) : null}

      {!order && error ? (
        <p className={`${panelErrorClass} mt-1`}>{error}</p>
      ) : !order ? (
        <OrderSkeleton />
      ) : (
        <div className="grid gap-4 pt-1 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="min-w-0 space-y-4">
            {error ? <p className={panelErrorClass}>{error}</p> : null}
            <AnimatePresence>
              {cancelNotice ? (
                <motion.p
                  key="cancel-notice"
                  className={panelSuccessClass}
                  role="status"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={trPanelFadeTransition}
                >
                  Sipariş iptal edildi. Stok geri yüklendi.
                </motion.p>
              ) : null}
            </AnimatePresence>

            <TrOrderFulfillmentCard
              boutiqueId={boutiqueId}
              hasCarrierIntegration={hasCarrierIntegration}
              order={order}
              busy={saving}
              onStatus={(status) => void setStatus(status)}
              onOrder={applyOrder}
            />
            <TrOrderCustomerCard
              order={order}
              customerOrderNumber={customerOrderNumber(list, order)}
              customerHref={
                order.customerId
                  ? withPanelOrigin(trPanelCustomerPath(order.customerId), selfPath)
                  : null
              }
            />
          </div>

          <div className="min-w-0 space-y-4">
            <TrOrderSummaryCard
              order={order}
              boutiqueName={boutique.name}
              storefrontHref={trBoutiquePath(boutique.slug)}
            />
            <TrOrderPaymentCard
              order={order}
              canMarkPaid={
                order.paymentStatus === "pending" &&
                !order.isSandbox &&
                !boutique.offersIyzicoCheckout
              }
              busy={saving}
              onMarkPaid={markPaid}
            />
          </div>
        </div>
      )}
    </TrPanelEditor>
  );
}

export function TrOwnerOrderDetailPage({ orderId }: { orderId: string }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <OrderPage
          key={`${activeBoutique.id}:${orderId}`}
          boutique={activeBoutique}
          orderId={orderId}
        />
      )}
    </TrOwnerPanelGate>
  );
}
