"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
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

  const decoded = useMemo(() => decodeURIComponent(email).toLowerCase(), [email]);

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
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </p>
        </TrPanelFadeIn>
      ) : !customer ? (
        <TrPanelFadeIn key="cd-miss">
          <p className="border border-black/10 bg-white px-4 py-8 text-[13px] text-neutral-600">
            Müşteri bulunamadı.
          </p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="cd-ready" className="space-y-6">
          <div className="border border-black/10 bg-white px-4 py-5">
            <p className="font-serif text-2xl text-neutral-950">{customer.name}</p>
            <p className="mt-1 text-[13px] text-neutral-600">{customer.email}</p>
            {customer.phone ? (
              <p className="text-[13px] text-neutral-600">{customer.phone}</p>
            ) : null}
            <div className="mt-4 flex gap-6">
              <div>
                <p className="font-serif text-2xl tabular-nums">
                  {customer.orderCount}
                </p>
                <p className="text-[11px] text-neutral-500">Sipariş</p>
              </div>
              <div>
                <p className="font-serif text-2xl tabular-nums">
                  {formatTryFromKurus(customer.spendKurus)}
                </p>
                <p className="text-[11px] text-neutral-500">Harcama</p>
              </div>
            </div>
          </div>

          <div className="border border-black/10 bg-white">
            <p className="border-b border-black/10 px-4 py-3 text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
              Siparişler
            </p>
            <ul className="divide-y divide-black/10">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={trPanelOrderPath(order.id)}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] hover:bg-neutral-50"
                  >
                    <span>
                      {new Intl.DateTimeFormat("tr-TR", {
                        timeZone: "Europe/Istanbul",
                        dateStyle: "medium",
                      }).format(new Date(order.createdAt))}
                    </span>
                    <span className="tabular-nums">
                      {formatTryFromKurus(order.totalKurus)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerCustomerDetailPage({ email }: { email: string }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelCustomersPath()}
              className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
            >
              ← Müşteriler
            </Link>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              Müşteri
            </h2>
          </div>
          <CustomerDetail boutiqueId={activeBoutique.id} email={email} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
