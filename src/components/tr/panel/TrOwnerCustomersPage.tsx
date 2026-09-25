"use client";

import { Download, Search, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TrCustomerFilterPopover } from "@/components/tr/panel/customers/TrCustomerFilterPopover";
import {
  TrCustomerListTable,
  type CustomerSort,
} from "@/components/tr/panel/customers/TrCustomerListTable";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  PANEL_PAGE_SIZES,
  TrPanelListPager,
} from "@/components/tr/panel/TrPanelListPager";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  TrPanelFadeIn,
  TrPanelListSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerCustomers,
  fetchOwnerOrders,
  peekOwnerCustomers,
  peekOwnerOrders,
} from "@/lib/tr/panel/ownerClient";
import { indexCustomerStats } from "@/lib/tr/customers/customerModel";
import {
  customerFilterCount,
  filterCustomers,
  NO_CUSTOMER_FILTERS,
  sortCustomers,
  type CustomerListFilters,
  type CustomerRow,
  type CustomerSortKey,
} from "@/lib/tr/panel/customerList";
import { trPanelNewCustomerPath } from "@/lib/tr/paths";
import type { TrBoutiqueCustomer, TrOrderWithItems } from "@/types/tr-marketplace";

function CustomersList({ boutiqueId }: { boutiqueId: string }) {
  const [customers, setCustomers] = useState<TrBoutiqueCustomer[] | null>(
    () => peekOwnerCustomers(boutiqueId) ?? null,
  );
  const [orders, setOrders] = useState<TrOrderWithItems[] | null>(
    () => peekOwnerOrders(boutiqueId) ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerListFilters>(NO_CUSTOMER_FILTERS);
  const [sort, setSort] = useState<CustomerSort>({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PANEL_PAGE_SIZES[0]);
  // "Bugün" / "Dün" in the date column are relative to when the page was opened.
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetchOwnerCustomers(boutiqueId).then(
      (result) => {
        if (!cancelled) setCustomers(result);
      },
      (loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error ? loadError.message : "Müşteriler yüklenemedi.",
        );
      },
    );
    // Totals come from the orders; if they can't be read the list still works.
    fetchOwnerOrders(boutiqueId).then(
      (result) => {
        if (!cancelled) setOrders(result);
      },
      () => {
        if (!cancelled) setOrders([]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const rows = useMemo<CustomerRow[]>(() => {
    if (!customers || !orders) return [];
    const stats = indexCustomerStats(orders, customers, boutiqueId);
    return customers.map((customer) => ({
      customer,
      stats: stats.get(customer.id)!,
    }));
  }, [customers, orders, boutiqueId]);

  const visible = useMemo(
    () => sortCustomers(filterCustomers(rows, filters, nowMs), sort.key, sort.direction),
    [rows, filters, sort, nowMs],
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => visible.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visible, currentPage, pageSize],
  );

  const narrowed = customerFilterCount(filters) > 0 || filters.search.trim() !== "";

  function changeFilters(patch: Partial<CustomerListFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(NO_CUSTOMER_FILTERS);
    setPage(1);
  }

  function changeSort(column: CustomerSortKey) {
    setSort((current) => ({
      key: column,
      // Names read best A → Z first; dates and totals biggest first.
      direction:
        current.key === column
          ? current.direction === "desc"
            ? "asc"
            : "desc"
          : column === "name"
            ? "asc"
            : "desc",
    }));
    setPage(1);
  }

  const loading = customers === null || orders === null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
          Müşteriler
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Import and export are not built yet; the buttons hold their place. */}
          <button
            type="button"
            disabled
            title="Yakında"
            className={`${panelSecondaryBtnClass} gap-2`}
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Dışa Aktar
          </button>
          <button
            type="button"
            disabled
            title="Yakında"
            className={`${panelSecondaryBtnClass} gap-2`}
          >
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            İçe Aktar
          </button>
          <Link href={trPanelNewCustomerPath()} className={panelPrimaryBtnClass}>
            Müşteri Ekle
          </Link>
        </div>
      </div>

      {error && !customers ? (
        <p className={panelErrorClass}>{error}</p>
      ) : loading ? (
        <TrPanelListSkeleton rows={6} label="Müşteriler yükleniyor" />
      ) : (
        <TrPanelFadeIn key="customers-ready" className="space-y-4" shift={false}>
          {rows.length > 0 ? (
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
                  aria-label="Müşterilerde ara"
                />
              </div>
              <TrCustomerFilterPopover
                filters={filters}
                onChange={changeFilters}
                onClear={clearFilters}
              />
            </div>
          ) : null}

          {rows.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz müşteri yok.
              <br />
              Müşteri ekleyin; ilk sipariş geldiğinde müşteri kendiliğinden oluşur.
            </p>
          ) : visible.length === 0 ? (
            <p className={panelEmptyClass}>
              Aramanıza uyan müşteri yok.
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
            <TrCustomerListTable
              rows={pageItems}
              nowMs={nowMs}
              sort={sort}
              onSort={changeSort}
              footer={
                <TrPanelListPager
                  page={currentPage}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  total={visible.length}
                  noun="Müşteri"
                  onPage={setPage}
                  onPageSize={(value) => {
                    setPageSize(value);
                    setPage(1);
                  }}
                />
              }
            />
          )}
        </TrPanelFadeIn>
      )}
    </div>
  );
}

export function TrOwnerCustomersPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <CustomersList key={activeBoutique.id} boutiqueId={activeBoutique.id} />
      )}
    </TrOwnerPanelGate>
  );
}
