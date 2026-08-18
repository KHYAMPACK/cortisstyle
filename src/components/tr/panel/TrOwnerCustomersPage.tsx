"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelBackLinkClass,
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
import { fetchOwnerCustomers, peekOwnerCustomers } from "@/lib/tr/ownerClient";
import { trPanelCustomerPath, trPanelPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrOwnerCustomer,
} from "@/types/tr-marketplace";

function CustomersList({ boutiqueId }: { boutiqueId: string }) {
  const cached = peekOwnerCustomers(boutiqueId);
  const [customers, setCustomers] = useState<TrOwnerCustomer[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
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

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return customers;
    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.email,
        customer.phone ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr");
      return haystack.includes(q);
    });
  }, [customers, query]);

  return (
    <>
      {loading && customers.length === 0 ? (
        <TrPanelListSkeleton rows={5} label="Müşteriler yükleniyor" />
      ) : error ? (
        <TrPanelFadeIn>
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn className="space-y-5">
          <div className="space-y-3">
            <p className="text-[17px] font-medium text-neutral-700">
              {query.trim()
                ? `${visible.length} / ${customers.length} müşteri`
                : `${customers.length} müşteri`}
            </p>
            {customers.length > 0 ? (
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="İsim, e-posta veya telefon ara…"
                className="w-full rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-4 py-3.5 text-[17px] text-neutral-900 outline-none focus:border-[color:var(--panel-accent)]"
              />
            ) : null}
          </div>

          {customers.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz sipariş veren müşteri yok.
            </p>
          ) : visible.length === 0 ? (
            <p className={panelEmptyClass}>Aramanıza uyan müşteri yok.</p>
          ) : (
            <TrPanelStagger className="space-y-3">
              {visible.map((customer) => (
                <motion.div key={customer.email} variants={trPanelStaggerItem}>
                  <Link
                    href={trPanelCustomerPath(customer.email)}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm transition-colors hover:bg-[color:var(--panel-accent-soft)] sm:p-5"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-[19px] font-semibold text-neutral-900">
                        {customer.name}
                      </p>
                      <p className="text-[15px] text-neutral-600">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-semibold tabular-nums text-neutral-950">
                        {formatTryFromKurus(customer.spendKurus)}
                      </p>
                      <p className="mt-1 text-[14px] text-neutral-600">
                        {customer.orderCount} sipariş
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </TrPanelStagger>
          )}
        </TrPanelFadeIn>
      )}
    </>
  );
}

export function TrOwnerCustomersPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Giriş
            </Link>
            <h2 className={panelPageTitleClass}>Müşteriler</h2>
            <p className={`mt-2 ${panelHintClass}`}>
              Sipariş veren müşterilerinizi buradan görün.
            </p>
          </div>
          <CustomersList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
