"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TrOrderItemThumbs } from "@/components/tr/panel/TrOrderItemThumbs";
import { TrOwnerOrderProcessGuide } from "@/components/tr/panel/TrOwnerOrderProcessGuide";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerPushPromptBanner } from "@/components/tr/panel/TrOwnerPushPromptBanner";
import { TrPanelBulkBar } from "@/components/tr/panel/TrPanelBulkBar";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import {
  FULFILLMENT_FILTERS,
  FULFILLMENT_HINT,
  FULFILLMENT_LABEL,
  FULFILLMENT_TONE,
  PAYMENT_LABEL,
  formatOrderDateShort,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelDesktopSearchClass,
  panelDesktopSelectClass,
} from "@/components/tr/panel/panelDesktopUi";
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
  TrPanelLoading,
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import {
  fetchOwnerOrders,
  updateOwnerOrderFulfillment,
} from "@/lib/tr/ownerClient";
import { PanelSelectCheckbox } from "@/components/tr/panel/PanelSelectCheckbox";
import { usePanelRowSelection } from "@/hooks/usePanelRowSelection";
import { markOrdersSeen } from "@/lib/tr/orderNotifications";
import { trPanelOrderPath, trPanelPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrFulfillmentStatus,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

const FULFILLMENT_OPTIONS: TrFulfillmentStatus[] = [
  "created",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function OrdersList({ boutiqueId }: { boutiqueId: string }) {
  const [orders, setOrders] = useState<TrOrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TrFulfillmentStatus>("all");
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    markOrdersSeen(boutiqueId);
  }, [boutiqueId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
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

  const visible = useMemo(() => {
    let list =
      filter === "all"
        ? orders
        : orders.filter((order) => order.fulfillmentStatus === filter);
    const q = search.trim().toLocaleLowerCase("tr");
    if (q) {
      list = list.filter((order) => {
        const name = order.customerName.toLocaleLowerCase("tr");
        const email = order.customerEmail.toLocaleLowerCase("tr");
        const id = order.id.toLocaleLowerCase("tr");
        return name.includes(q) || email.includes(q) || id.includes(q);
      });
    }
    return list;
  }, [filter, orders, search]);

  const orderedIds = useMemo(() => visible.map((o) => o.id), [visible]);
  const selection = usePanelRowSelection(orderedIds);

  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.fulfillmentStatus === "created" || o.fulfillmentStatus === "ready",
      ).length,
    [orders],
  );

  const applyLocal = (updated: TrOrderWithItems) => {
    setOrders((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
  };

  const markSaving = (id: string, on: boolean) => {
    setSavingIds((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const patchFulfillment = async (
    orderId: string,
    fulfillmentStatus: TrFulfillmentStatus,
  ) => {
    markSaving(orderId, true);
    setError(null);
    try {
      const updated = await updateOwnerOrderFulfillment(
        boutiqueId,
        orderId,
        fulfillmentStatus,
      );
      applyLocal(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Sipariş güncellenemedi.",
      );
    } finally {
      markSaving(orderId, false);
    }
  };

  const runBulkFulfillment = async (status: TrFulfillmentStatus) => {
    const ids = [...selection.selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    setError(null);
    const result = await runOwnerPatches(
      ids,
      (id) => updateOwnerOrderFulfillment(boutiqueId, id, status),
      { concurrency: 4 },
    );
    for (const updated of result.ok) applyLocal(updated);
    if (result.failed.length > 0) {
      setError(
        `${result.failed.length} sipariş güncellenemedi: ${result.failed[0]?.error}`,
      );
    }
    setBulkBusy(false);
    selection.clear();
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <TrPanelLoading key="orders-loading" label="Siparişler yükleniyor…" />
      ) : error && orders.length === 0 ? (
        <TrPanelFadeIn key="orders-error">
          <p className={panelErrorClass}>{error}</p>
        </TrPanelFadeIn>
      ) : (
        <TrPanelFadeIn key="orders-ready" className="space-y-5">
          {error ? <p className={panelErrorClass}>{error}</p> : null}
          <TrOwnerPushPromptBanner boutiqueId={boutiqueId} />
          <div className="lg:hidden">
            <TrOwnerOrderProcessGuide />
          </div>

          <div className="space-y-3">
            <p className="text-[17px] font-medium text-neutral-700 lg:text-[14px]">
              {orders.length === 0
                ? "Henüz sipariş yok"
                : pendingCount > 0
                  ? `${pendingCount} sipariş bekliyor · toplam ${orders.length}`
                  : `${orders.length} sipariş`}
            </p>
            <p className={`${panelHintClass} lg:hidden`}>
              Filtreyle sadece ilgilenmeniz gerekenleri gösterin. Bir satıra
              dokunarak detayı açın.
            </p>
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT_FILTERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={panelChipClass(filter === key)}
                  style={
                    filter === key
                      ? { backgroundColor: "var(--panel-accent)" }
                      : undefined
                  }
                >
                  {key === "all" ? "Tümü" : FULFILLMENT_LABEL[key]}
                </button>
              ))}
            </div>
          </div>

          {orders.length > 0 ? (
            <div className="hidden lg:block">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tabloda ara…"
                className={panelDesktopSearchClass}
                aria-label="Siparişlerde ara"
              />
            </div>
          ) : null}

          {visible.length === 0 ? (
            <p className={panelEmptyClass}>
              {orders.length === 0
                ? "Müşteri alışveriş yapınca siparişler burada görünür."
                : "Bu filtrede sipariş yok. “Tümü”ne geçmeyi deneyin."}
            </p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="lg:hidden">
                <TrPanelStagger className="space-y-3">
                  {visible.map((order) => {
                    const itemCount = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    const paymentKey =
                      order.isSandbox || order.paymentStatus === "sandbox"
                        ? "sandbox"
                        : order.paymentStatus;

                    return (
                      <motion.div
                        key={order.id}
                        variants={trPanelStaggerItem}
                      >
                        <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-3">
                              <p className="text-[19px] font-semibold text-neutral-900 sm:text-[20px]">
                                {order.customerName}
                              </p>
                              <p className="text-[15px] text-neutral-600">
                                {formatOrderDateShort(order.createdAt)} ·{" "}
                                {itemCount} ürün
                              </p>
                              <div>
                                <p className="mb-2 text-[14px] font-medium text-neutral-600">
                                  Paketlenecek ürünler
                                </p>
                                <TrOrderItemThumbs
                                  items={order.items}
                                  size="md"
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-lg px-2.5 py-1 text-[14px] font-semibold ${FULFILLMENT_TONE[order.fulfillmentStatus]}`}
                                >
                                  {FULFILLMENT_LABEL[order.fulfillmentStatus]}
                                </span>
                                <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-[14px] font-medium text-neutral-700">
                                  {PAYMENT_LABEL[paymentKey]}
                                </span>
                              </div>
                              <p className="text-[15px] leading-relaxed text-neutral-600">
                                {FULFILLMENT_HINT[order.fulfillmentStatus]}
                              </p>
                              <Link
                                href={trPanelOrderPath(order.id)}
                                className="inline-block text-[15px] font-medium text-[color:var(--panel-accent-deep)]"
                              >
                                Detayı aç →
                              </Link>
                            </div>
                            <p className="shrink-0 text-[22px] font-semibold tabular-nums text-neutral-950">
                              {formatTryFromKurus(order.totalKurus)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </TrPanelStagger>
              </div>

              {/* Desktop table */}
              <div className="hidden space-y-3 lg:block">
                <TrPanelDataTable
                  onKeyDown={selection.onKeyDown}
                  selectAll={{
                    checked: selection.allVisibleSelected,
                    indeterminate:
                      selection.someVisibleSelected &&
                      !selection.allVisibleSelected,
                    onChange: selection.setAllVisible,
                    disabled: bulkBusy,
                  }}
                  headers={[
                    "Sipariş",
                    "Tarih",
                    "Müşteri",
                    "Durum",
                    "Ödeme",
                    "Ürün",
                    "Toplam",
                    "",
                  ]}
                  footer={`${visible.length} sipariş · Shift aralık · Ctrl+A tümü`}
                >
                  {visible.map((order) => {
                    const itemCount = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    const paymentKey =
                      order.isSandbox || order.paymentStatus === "sandbox"
                        ? "sandbox"
                        : order.paymentStatus;
                    const busy = savingIds.has(order.id) || bulkBusy;

                    return (
                      <TrPanelDataTableRow
                        key={order.id}
                        selected={selection.isSelected(order.id)}
                      >
                        <TrPanelDataTableCell className="w-10">
                          <PanelSelectCheckbox
                            id={order.id}
                            checked={selection.isSelected(order.id)}
                            disabled={bulkBusy}
                            label={`Sipariş ${shortOrderId(order.id)} seç`}
                            onItemClick={selection.onItemClick}
                          />
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <Link
                            href={trPanelOrderPath(order.id)}
                            className="font-semibold tabular-nums text-[color:var(--panel-accent-deep)] hover:underline"
                          >
                            #{shortOrderId(order.id)}
                          </Link>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <span className="whitespace-nowrap text-neutral-600">
                            {formatOrderDateShort(order.createdAt)}
                          </span>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-neutral-900">
                              {order.customerName}
                            </p>
                            <p className="truncate text-[12px] text-neutral-500">
                              {order.customerEmail}
                            </p>
                          </div>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <select
                            className={panelDesktopSelectClass}
                            value={order.fulfillmentStatus}
                            disabled={busy}
                            onChange={(event) => {
                              void patchFulfillment(
                                order.id,
                                event.target.value as TrFulfillmentStatus,
                              );
                            }}
                          >
                            {FULFILLMENT_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {FULFILLMENT_LABEL[status]}
                              </option>
                            ))}
                          </select>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-neutral-700">
                            {PAYMENT_LABEL[paymentKey]}
                          </span>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <span className="tabular-nums">{itemCount}</span>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <span className="font-semibold tabular-nums">
                            {formatTryFromKurus(order.totalKurus)}
                          </span>
                        </TrPanelDataTableCell>
                        <TrPanelDataTableCell>
                          <Link
                            href={trPanelOrderPath(order.id)}
                            className="text-[12px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
                          >
                            Detay
                          </Link>
                        </TrPanelDataTableCell>
                      </TrPanelDataTableRow>
                    );
                  })}
                </TrPanelDataTable>

                <TrPanelBulkBar
                  selectedCount={selection.selectedCount}
                  onClear={selection.clear}
                  busy={bulkBusy}
                >
                  <select
                    className={panelDesktopSelectClass}
                    defaultValue=""
                    disabled={bulkBusy}
                    onChange={(event) => {
                      const value = event.target
                        .value as TrFulfillmentStatus | "";
                      if (!value) return;
                      void runBulkFulfillment(value);
                      event.target.value = "";
                    }}
                  >
                    <option value="" disabled>
                      Durum ata…
                    </option>
                    {FULFILLMENT_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {FULFILLMENT_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </TrPanelBulkBar>
              </div>
            </>
          )}
        </TrPanelFadeIn>
      )}
    </AnimatePresence>
  );
}

export function TrOwnerOrdersPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-5">
          <div>
            <Link
              href={trPanelPath()}
              className={`${panelBackLinkClass} lg:hidden`}
            >
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Siparişler</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-600 lg:text-[14px]">
              Paketleyin ve durumları güncelleyin. Kargo entegrasyonu yakında.
            </p>
          </div>
          <OrdersList boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
