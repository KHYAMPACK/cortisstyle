"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import { fetchOwnerCustomers } from "@/lib/tr/ownerClient";
import { trPanelCustomerPath, trPanelPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrOwnerCustomer,
} from "@/types/tr-marketplace";

function CustomersList({ boutiqueId }: { boutiqueId: string }) {
  const [customers, setCustomers] = useState<TrOwnerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerCustomers(boutiqueId);
        if (!cancelled) setCustomers(result);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Müşteriler yüklenemedi.",
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

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="c-loading" label="Müşteriler yükleniyor…" />
      ) : error ? (
        <TrPanelFadeIn key="c-error">
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="c-ready" className="space-y-4">
          <p className="text-[12px] text-neutral-600">
            {customers.length} müşteri
          </p>
          {customers.length === 0 ? (
            <p className="border border-black/10 bg-white px-4 py-8 text-[13px] text-neutral-600">
              Henüz sipariş veren müşteri yok.
            </p>
          ) : (
            <ul className="divide-y divide-black/10 border border-black/10 bg-white">
              {customers.map((customer) => (
                <li key={customer.email}>
                  <Link
                    href={trPanelCustomerPath(customer.email)}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-neutral-50"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">
                        {customer.name}
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-lg tabular-nums">
                        {formatTryFromKurus(customer.spendKurus)}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {customer.orderCount} sipariş
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerCustomersPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link
              href={trPanelPath()}
              className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
            >
              ← Ana sayfa
            </Link>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
              Müşteriler
            </h2>
          </div>
          <CustomersList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
