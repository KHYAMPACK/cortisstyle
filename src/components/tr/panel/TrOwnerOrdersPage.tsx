"use client";

import { Search, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { downloadOrdersCsv } from "@/components/tr/panel/orders/orderExport";
import {
  TrOrderBulkMenu,
  type OrderBulkMenuItem,
} from "@/components/tr/panel/orders/TrOrderBulkMenu";
import { TrOrderFilterPopover } from "@/components/tr/panel/orders/TrOrderFilterPopover";
import {
  TrOrderListTable,
  type OrderSort,
} from "@/components/tr/panel/orders/TrOrderListTable";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerPushPromptBanner } from "@/components/tr/panel/TrOwnerPushPromptBanner";
import { toast } from "@/lib/tr/panel/toast";
import {
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  PANEL_PAGE_SIZES,
  TrPanelListPager,
} from "@/components/tr/panel/TrPanelListPager";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import { usePanelRowSelection } from "@/hooks/usePanelRowSelection";
import {
  beginOwnerLabelPrint,
  fetchOwnerOrders,
  fetchOwnerShipmentLabel,
  peekOwnerOrders,
  updateOwnerOrderFulfillment,
  updateOwnerOrderPaymentPaid,
} from "@/lib/tr/ownerClient";
import { runOwnerPatches } from "@/lib/tr/ownerBulk";
import { markOrdersSeen } from "@/lib/tr/orderNotifications";
import {
  BULK_STATUS_OF,
  eligibleOrders,
  summarizeBulkRun,
  type OrderBulkAction,
  type OrderBulkContext,
  type OrderBulkResultSummary,
} from "@/lib/tr/panel/orderBulk";
import {
  filterOrders,
  NO_ORDER_FILTERS,
  orderFilterCount,
  sortOrders,
  type OrderListFilters,
  type OrderSortKey,
} from "@/lib/tr/panel/orderList";
import { orderPaymentKey } from "@/lib/tr/panel/orderView";
import { trPanelNewOrderPath } from "@/lib/tr/paths";
import { boutiqueHasCarrierIntegration } from "@/lib/tr/shipping/registry";
import type { TrOrderWithItems, TrPaymentStatus } from "@/types/tr-marketplace";

function announceBulkRun(summary: OrderBulkResultSummary): void {
  const message = summary.lines.join(" ");
  if (summary.tone === "success") toast.success(message);
  else if (summary.tone === "warning") toast.warning(message);
  else toast.error(message);
}

/** Order the payment statuses appear in the Filtre popover. */
const PAYMENT_ORDER: TrPaymentStatus[] = [
  "paid",
  "pending",
  "failed",
  "refunded",
  "sandbox",
];

type BulkMenuId = OrderBulkAction | "export";

function OrdersList({
  boutiqueId,
  boutiqueName,
  hasCarrierIntegration,
  offersCardPayments,
  canCreateOrders,
}: {
  boutiqueId: string;
  boutiqueName: string;
  hasCarrierIntegration: boolean;
  offersCardPayments: boolean;
  /** Custom-art boutiques can't create orders by hand (they need the customer's photo). */
  canCreateOrders: boolean;
}) {
  const bulkContext = useMemo<OrderBulkContext>(
    () => ({ hasCarrierIntegration, offersCardPayments }),
    [hasCarrierIntegration, offersCardPayments],
  );
  const cached = peekOwnerOrders(boutiqueId);
  const [orders, setOrders] = useState<TrOrderWithItems[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderListFilters>(NO_ORDER_FILTERS);
  const [sort, setSort] = useState<OrderSort>({ key: "date", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PANEL_PAGE_SIZES[0]);
  const [bulkBusy, setBulkBusy] = useState(false);
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

  // Selection only ever holds orders on screen, so a bulk action can't reach an
  // order you can't see (the hook drops ids that leave the page).
  const orderedIds = useMemo(() => pageItems.map((order) => order.id), [pageItems]);
  const selection = usePanelRowSelection(orderedIds);
  const selectedOrders = useMemo(
    () => pageItems.filter((order) => selection.selectedIds.has(order.id)),
    [pageItems, selection.selectedIds],
  );

  const menuItems = useMemo<OrderBulkMenuItem<BulkMenuId>[]>(() => {
    const count = (action: OrderBulkAction) =>
      eligibleOrders(action, selectedOrders, bulkContext).length;
    const items: OrderBulkMenuItem<BulkMenuId>[] = [
      { id: "ready", label: "Kargoya hazır yap", count: count("ready") },
      { id: "shipped", label: "Kargoda yap", count: count("shipped") },
      { id: "delivered", label: "Teslim edildi yap", count: count("delivered") },
    ];
    if (!bulkContext.offersCardPayments) {
      items.push({
        id: "paid",
        label: "Ödendi olarak işaretle",
        count: count("paid"),
      });
    }
    if (bulkContext.hasCarrierIntegration) {
      items.push({
        id: "print-labels",
        label: "Kargo etiketi bastır",
        count: count("print-labels"),
      });
    }
    items.push({
      id: "export",
      label: "Seçilenleri dışa aktar",
      count: selectedOrders.length,
      dividerBefore: true,
    });
    return items;
  }, [selectedOrders, bulkContext]);

  async function runBulk(id: BulkMenuId) {
    if (id === "export") {
      downloadOrdersCsv(selectedOrders);
      return;
    }
    const targets = eligibleOrders(id, selectedOrders, bulkContext);
    if (targets.length === 0 || bulkBusy) return;

    // The print tab has to open inside this click, before anything is awaited,
    // or the browser blocks it.
    const printTab = id === "print-labels" ? beginOwnerLabelPrint() : null;
    if (id === "print-labels" && !printTab) {
      toast.error(
        "Tarayıcı yazdırma sekmesini engelledi. Bu site için açılır pencerelere izin verin.",
      );
      return;
    }

    setBulkBusy(true);
    const targetIds = targets.map((order) => order.id);
    try {
      let done = 0;
      let failed: Array<{ id: string; error: string }> = [];

      if (id === "print-labels") {
        const result = await runOwnerPatches(
          targetIds,
          async (orderId) => ({
            id: orderId,
            svg: await fetchOwnerShipmentLabel(boutiqueId, orderId),
          }),
          { concurrency: 3 },
        );
        const svgById = new Map(result.ok.map((entry) => [entry.id, entry.svg]));
        // Print in the order the orders are listed, not the order they finished.
        const svgs = targetIds.flatMap((orderId) => svgById.get(orderId) ?? []);
        if (svgs.length > 0) printTab?.show(svgs);
        else printTab?.abort();
        done = svgs.length;
        failed = result.failed;
      } else {
        const result = await runOwnerPatches(targetIds, (orderId) =>
          id === "paid"
            ? updateOwnerOrderPaymentPaid(boutiqueId, orderId)
            : updateOwnerOrderFulfillment(boutiqueId, orderId, BULK_STATUS_OF[id]!),
        );
        const updated = new Map(result.ok.map((order) => [order.id, order]));
        setOrders((current) =>
          current.map((order) => updated.get(order.id) ?? order),
        );
        done = result.ok.length;
        failed = result.failed;
      }

      announceBulkRun(
        summarizeBulkRun({
          action: id,
          done,
          failed,
          skipped: selectedOrders.length - targets.length,
        }),
      );
      // Pick up anything that changed on the server (a label cancelled elsewhere, …).
      fetchOwnerOrders(boutiqueId).then(setOrders, () => {});
    } catch (bulkError) {
      printTab?.abort();
      toast.error(bulkError, "İşlem tamamlanamadı.");
    } finally {
      setBulkBusy(false);
    }
  }

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
        <div className="flex flex-wrap items-center gap-2">
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
          {canCreateOrders ? (
            <Link href={trPanelNewOrderPath()} className={panelPrimaryBtnClass}>
              Sipariş Oluştur
            </Link>
          ) : null}
        </div>
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
              {selection.selectedCount > 0 ? (
                <div className="hidden lg:block">
                  <TrOrderBulkMenu
                    selectedCount={selection.selectedCount}
                    items={menuItems}
                    busy={bulkBusy}
                    onRun={(id) => void runBulk(id)}
                  />
                </div>
              ) : null}
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
              selection={selection}
              selectionDisabled={bulkBusy}
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
          hasCarrierIntegration={boutiqueHasCarrierIntegration(activeBoutique.slug)}
          offersCardPayments={Boolean(activeBoutique.offersIyzicoCheckout)}
          canCreateOrders={activeBoutique.catalogProfile !== "custom_art"}
        />
      )}
    </TrOwnerPanelGate>
  );
}
