"use client";

import { StickyNote } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import {
  TrPanelStagger,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import { TrPanelSortHeader } from "@/components/tr/panel/TrPanelSortHeader";
import type {
  CustomerRow,
  CustomerSortDirection,
  CustomerSortKey,
} from "@/lib/tr/panel/customerList";
import { orderListDate } from "@/lib/tr/panel/orderList";
import { trPanelCustomerPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

export interface CustomerSort {
  key: CustomerSortKey;
  direction: CustomerSortDirection;
}

function OrderTotals({ row }: { row: CustomerRow }) {
  if (row.stats.orderCount === 0) {
    return <span className="text-neutral-500">Sipariş Yok</span>;
  }
  return (
    <>
      <p className="tabular-nums">{formatTryFromKurus(row.stats.spendKurus)}</p>
      <p className="text-[12px] text-[color:var(--panel-accent-deep)]">
        {row.stats.orderCount} Sipariş
      </p>
    </>
  );
}

function NoteMark({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <span title={note} className="shrink-0 text-neutral-400">
      <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} aria-label="Notu var" />
    </span>
  );
}

/**
 * The customer list: a table on desktop (the whole row opens the customer) and one
 * card per customer on phones.
 */
export function TrCustomerListTable({
  rows,
  nowMs,
  sort,
  onSort,
  footer,
}: {
  rows: CustomerRow[];
  nowMs: number;
  sort: CustomerSort;
  onSort: (column: CustomerSortKey) => void;
  footer: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <>
      {/* Phones */}
      <div className="space-y-4 lg:hidden">
        <TrPanelStagger className="space-y-3">
          {rows.map((row) => {
            const { customer } = row;
            return (
              <motion.div key={customer.id} variants={trPanelStaggerItem}>
                <Link
                  href={trPanelCustomerPath(customer.id)}
                  className="block space-y-1.5 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-[color:var(--panel-accent-soft)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-neutral-900">
                      <span className="truncate">{customer.name}</span>
                      <NoteMark note={customer.note} />
                    </p>
                    <p className="shrink-0 text-[13px] text-neutral-600">
                      {row.stats.orderCount === 0
                        ? "Sipariş Yok"
                        : `${row.stats.orderCount} sipariş`}
                    </p>
                  </div>
                  <p className="truncate text-[13px] text-neutral-600">
                    {customer.email}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </p>
                  {row.stats.orderCount > 0 ? (
                    <p className="text-[13px] font-medium tabular-nums text-neutral-900">
                      {formatTryFromKurus(row.stats.spendKurus)}
                    </p>
                  ) : null}
                </Link>
              </motion.div>
            );
          })}
        </TrPanelStagger>
        <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3">
          {footer}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <TrPanelDataTable
          contained={false}
          headers={[
            <TrPanelSortHeader
              key="name"
              label="Müşteri"
              active={sort.key === "name"}
              direction={sort.direction}
              onSort={() => onSort("name")}
            />,
            "İletişim Bilgileri",
            <TrPanelSortHeader
              key="createdAt"
              label="Oluşturulma Tarihi"
              active={sort.key === "createdAt"}
              direction={sort.direction}
              onSort={() => onSort("createdAt")}
            />,
            <TrPanelSortHeader
              key="spend"
              label="Toplam Sipariş"
              active={sort.key === "spend"}
              direction={sort.direction}
              onSort={() => onSort("spend")}
            />,
          ]}
          footer={footer}
        >
          {rows.map((row) => {
            const { customer } = row;
            const href = trPanelCustomerPath(customer.id);
            const added = orderListDate(customer.createdAt, nowMs);
            return (
              <TrPanelDataTableRow
                key={customer.id}
                onActivate={() => router.push(href)}
                onPointerEnter={() => router.prefetch(href)}
              >
                <TrPanelDataTableCell>
                  <span className="flex items-center gap-2">
                    <Link
                      href={href}
                      className="max-w-[240px] truncate font-semibold text-neutral-900 hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <NoteMark note={customer.note} />
                  </span>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <p className="max-w-[260px] truncate">{customer.email}</p>
                  {customer.phone ? (
                    <p className="text-[12px] text-neutral-500">{customer.phone}</p>
                  ) : null}
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <p>{added.day}</p>
                  <p className="text-[12px] text-neutral-500">{added.time}</p>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <OrderTotals row={row} />
                </TrPanelDataTableCell>
              </TrPanelDataTableRow>
            );
          })}
        </TrPanelDataTable>
      </div>
    </>
  );
}
