"use client";

import { Search, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { downloadOrdersCsv } from "@/components/tr/panel/orders/orderExport";
import { TrOrderFilterPopover } from "@/components/tr/panel/orders/TrOrderFilterPopover";
import {
  TrOrderListTable,
  type OrderSort,
} from "@/components/tr/panel/orders/TrOrderListTable";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerPushPromptBanner } from "@/components/tr/panel/TrOwnerPushPromptBanner";
import {
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  PANEL_PAGE_SIZES,
  TrPanelListPager,
} from "@/components/tr/panel/TrPanelListPager";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import { fetchOwnerOrders, peekOwnerOrders } from "@/lib/tr/ownerClient";
import { markOrdersSeen } from "@/lib/tr/orderNotifications";
import {
  filterOrders,
  NO_ORDER_FILTERS,
  orderFilterCount,
  sortOrders,
  type OrderListFilters,
  type OrderSortKey,
} from "@/lib/tr/panel/orderList";
import { orderPaymentKey } from "@/lib/tr/panel/orderView";
import type { TrOrderWithItems, TrPaymentStatus } from "@/types/tr-marketplace";

/** Order the payment statuses appear in the Filtre popover. */
const PAYMENT_ORDER: TrPaymentStatus[] = [
  "paid",
  "pending",
  "failed",
  "refunded",
  "sandbox",
];

function OrdersList({
  boutiqueId,
  boutiqueName,
}: {
  boutiqueId: string;
  boutiqueName: string;
}) {
  const cached = peekOwnerOrders(boutiqueId);
  const [orders, setOrders] = useState<TrOrderWithItems[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderListFilters>(NO_ORDER_FILTERS);
  const [sort, setSort] = useState<OrderSort>({ key: "date", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PANEL_PAGE_SIZES[0]);
  // "Bugün" / "Dün" in the date column are relative to when the page was opened.
  const [nowMs] = useState(() => Date.now());

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
    () => sortOrders(filterOrders(orders, filters, nowMs), sort.key, sort.direction),
    [orders, filters, sort, nowMs],
  );

  const paymentStatuses = useMemo(() => {
    const present = new Set(orders.map(orderPaymentKey));
    return PAYMENT_ORDER.filter((status) => present.has(status));
  }, [orders]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => visible.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visible, currentPage, pageSize],
  );

  const filterCount = orderFilterCount(filters);
  const narrowed = filterCount > 0 || filters.search.trim() !== "";

  function changeFilters(patch: Partial<OrderListFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(NO_ORDER_FILTERS);
    setPage(1);
  }

  function changeSort(column: OrderSortKey) {
    setSort((current) => ({
      key: column,
      direction:
        current.key === column && current.direction === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  }

  function changePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  const pager = (
    <TrPanelListPager
      page={currentPage}
      pageCount={pageCount}
      pageSize={pageSize}
      total={visible.length}
      noun="Sipariş"
      onPage={setPage}
      onPageSize={changePageSize}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
          Siparişler
        </h2>
        <button
          type="button"
          onClick={() => downloadOrdersCsv(visible)}
          disabled={visible.length === 0}
          title="Listelenen siparişleri CSV olarak indir"
          className={`${panelSecondaryBtnClass} gap-2`}
        >
          <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Dışa Aktar
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <TrPanelListSkeleton rows={6} label="Siparişler yükleniyor" />
      ) : error && orders.length === 0 ? (
        <p className={panelErrorClass}>{error}</p>
      ) : (
        <TrPanelFadeIn key="orders-ready" className="space-y-4" shift={false}>
          <TrOwnerPushPromptBanner boutiqueId={boutiqueId} />
          {error ? <p className={panelErrorClass}>{error}</p> : null}

          {orders.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(event) => changeFilters({ search: event.target.value })}
                  placeholder="Tabloda arama yapın"
                  className={`${panelFieldClass} pl-9`}
                  aria-label="Siparişlerde ara"
                />
              </div>
              <TrOrderFilterPopover
                filters={filters}
                paymentStatuses={paymentStatuses}
                onChange={changeFilters}
                onClear={clearFilters}
              />
            </div>
          ) : null}

          {orders.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz sipariş yok.
              <br />
              Müşteri alışveriş yapınca siparişler burada görünür.
            </p>
          ) : visible.length === 0 ? (
            <p className={panelEmptyClass}>
              Aramanıza uyan sipariş yok.
              {narrowed ? (
                <>
                  <br />
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 inline-block font-semibold underline"
                    style={{ color: "var(--panel-accent-deep)" }}
                  >
                    Aramayı ve filtreleri temizle
                  </button>
                </>
              ) : null}
            </p>
          ) : (
            <TrOrderListTable
              orders={pageItems}
              nowMs={nowMs}
              boutiqueName={boutiqueName}
              sort={sort}
              onSort={changeSort}
              footer={pager}
            />
          )}
        </TrPanelFadeIn>
      )}
    </div>
  );
}

export function TrOwnerOrdersPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <OrdersList
          key={activeBoutique.id}
          boutiqueId={activeBoutique.id}
          boutiqueName={activeBoutique.name}
        />
      )}
    </TrOwnerPanelGate>
  );
}
