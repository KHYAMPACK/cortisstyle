"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerOrderListCard } from "@/components/tr/panel/TrOwnerOrderListCard";
import { TrOwnerOrderProcessGuide } from "@/components/tr/panel/TrOwnerOrderProcessGuide";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerPushPromptBanner } from "@/components/tr/panel/TrOwnerPushPromptBanner";
import {
  FULFILLMENT_FILTERS,
  FULFILLMENT_LABEL,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelBackLinkClass,
  panelChipClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerOrders,
  peekOwnerOrders,
} from "@/lib/tr/ownerClient";
import { markOrdersSeen } from "@/lib/tr/orderNotifications";
import { trPanelPath } from "@/lib/tr/paths";
import {
  type TrFulfillmentStatus,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

function OrdersList({
  boutiqueId,
  boutiqueSlug,
  offersIyzicoCheckout,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  offersIyzicoCheckout: boolean;
}) {
  const cached = peekOwnerOrders(boutiqueId);
  const [orders, setOrders] = useState<TrOrderWithItems[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TrFulfillmentStatus>("all");

  useEffect(() => {
    markOrdersSeen(boutiqueId);
  }, [boutiqueId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const result = await fetchOwnerOrders(boutiqueId);
        if (!cancelled) setOrders(result);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Siparişler yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? orders
        : orders.filter((order) => order.fulfillmentStatus === filter),
    [filter, orders],
  );

  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.fulfillmentStatus === "created" || o.fulfillmentStatus === "ready",
      ).length,
    [orders],
  );

  return (
    <>
      {loading && orders.length === 0 ? (
        <TrPanelListSkeleton rows={5} label="Siparişler yükleniyor" />
      ) : error && orders.length === 0 ? (
        <p className={panelErrorClass}>{error}</p>
      ) : (
        <TrPanelFadeIn key="orders-ready" className="space-y-5">
          <TrOwnerPushPromptBanner boutiqueId={boutiqueId} />
          <TrOwnerOrderProcessGuide boutiqueSlug={boutiqueSlug} />

          <div className="space-y-3">
            <p className="text-[17px] font-medium text-neutral-700">
              {orders.length === 0
                ? "Henüz sipariş yok"
                : pendingCount > 0
                  ? `${pendingCount} sipariş bekliyor · toplam ${orders.length}`
                  : `${orders.length} sipariş`}
            </p>
            <p className={panelHintClass}>
              Paketleyin ve sonraki adımı buradan ilerletin. Adres düzeltme
              veya iptal için detaya girin.
            </p>
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT_FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={panelChipClass(filter === key)}
                >
                  {key === "all" ? "Tümü" : FULFILLMENT_LABEL[key]}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className={panelEmptyClass}>
              {orders.length === 0
                ? "Müşteri alışveriş yapınca siparişler burada görünür."
                : "Bu filtrede sipariş yok. “Tümü”ne geçmeyi deneyin."}
            </p>
          ) : (
            <TrPanelStagger className="space-y-3">
              {visible.map((order) => (
                <motion.div key={order.id} variants={trPanelStaggerItem}>
                  <TrOwnerOrderListCard
                    boutiqueId={boutiqueId}
                    boutiqueSlug={boutiqueSlug}
                    offersIyzicoCheckout={offersIyzicoCheckout}
                    order={order}
                    onUpdated={(updated) =>
                      setOrders((current) =>
                        current.map((item) =>
                          item.id === updated.id ? updated : item,
                        ),
                      )
                    }
                  />
                </motion.div>
              ))}
            </TrPanelStagger>
          )}
        </TrPanelFadeIn>
      )}
    </>
  );
}

export function TrOwnerOrdersPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Giriş
            </Link>
            <h2 className={panelPageTitleClass}>Siparişler</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600">
              Çoğu siparişi listeden paketleyip ilerletin; detay istisnalar
              içindir.
            </p>
          </div>
          <OrdersList
            boutiqueId={activeBoutique.id}
            boutiqueSlug={activeBoutique.slug}
            offersIyzicoCheckout={Boolean(activeBoutique.offersIyzicoCheckout)}
          />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
