"use client";

import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  formatOrderDateShort,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerCustomers,
  fetchOwnerOrders,
} from "@/lib/tr/ownerClient";
import { trPanelCustomersPath, trPanelOrderPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrOrderWithItems,
  type TrOwnerCustomer,
} from "@/types/tr-marketplace";

function CustomerDetail({
  boutiqueId,
  email,
}: {
  boutiqueId: string;
  email: string;
}) {
  const [customer, setCustomer] = useState<TrOwnerCustomer | null>(null);
  const [orders, setOrders] = useState<TrOrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decoded = useMemo(
    () => decodeURIComponent(email).toLowerCase(),
    [email],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [customers, allOrders] = await Promise.all([
          fetchOwnerCustomers(boutiqueId),
          fetchOwnerOrders(boutiqueId),
        ]);
        if (cancelled) return;
        setCustomer(
          customers.find((entry) => entry.email.toLowerCase() === decoded) ??
            null,
        );
        setOrders(
          allOrders.filter(
            (order) => order.customerEmail.toLowerCase() === decoded,
          ),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Müşteri yüklenemedi.",
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
  }, [boutiqueId, decoded]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="cd-loading" label="Müşteri yükleniyor…" />
      ) : error ? (
        <TrPanelFadeIn key="cd-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : !customer ? (
        <TrPanelFadeIn key="cd-miss">
          <p className={panelEmptyClass}>Müşteri bulunamadı.</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="cd-ready" className="space-y-5">
          <section className={panelSectionClass}>
            <p className="text-[22px] font-semibold text-neutral-950 sm:text-[24px]">
              {customer.name}
            </p>
            <p className={`mt-2 ${panelHintClass}`}>{customer.email}</p>
            {customer.phone ? (
              <p className={panelHintClass}>{customer.phone}</p>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-4">
                <p className="text-[28px] font-semibold tabular-nums text-neutral-950">
                  {customer.orderCount}
                </p>
                <p className="mt-1 text-[15px] text-neutral-600">Sipariş</p>
              </div>
              <div className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-4">
                <p className="text-[22px] font-semibold tabular-nums text-neutral-950 sm:text-[28px]">
                  {formatTryFromKurus(customer.spendKurus)}
                </p>
                <p className="mt-1 text-[15px] text-neutral-600">Harcama</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[18px] font-semibold text-neutral-900">
              Siparişler
            </p>
            {orders.length === 0 ? (
              <p className={panelEmptyClass}>Bu müşterinin siparişi yok.</p>
            ) : (
              <TrPanelStagger className="space-y-3">
                {orders.map((order) => (
                  <motion.div key={order.id} variants={trPanelStaggerItem}>
                    <Link
                      href={trPanelOrderPath(order.id)}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-4 py-4 shadow-sm transition-colors hover:bg-[color:var(--panel-accent-soft)] sm:px-5"
                    >
                      <div>
                        <p className="text-[16px] font-medium text-neutral-900">
                          {formatOrderDateShort(order.createdAt)}
                        </p>
                        <p className="mt-1 text-[14px] font-medium text-[color:var(--panel-accent-deep)]">
                          Siparişi aç →
                        </p>
                      </div>
                      <p className="text-[20px] font-semibold tabular-nums text-neutral-950">
                        {formatTryFromKurus(order.totalKurus)}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </TrPanelStagger>
            )}
          </section>
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerCustomerDetailPage({ email }: { email: string }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link href={trPanelCustomersPath()} className={panelBackLinkClass}>
              ← Müşteriler
            </Link>
            <h2 className={panelPageTitleClass}>Müşteri</h2>
          </div>
          <CustomerDetail boutiqueId={activeBoutique.id} email={email} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
