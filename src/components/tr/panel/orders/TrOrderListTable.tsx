"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrOrderFulfillmentOutlineChip,
  TrOrderPaymentOutlineChip,
} from "@/components/tr/panel/orders/TrOrderBadges";
import { PanelSelectCheckbox } from "@/components/tr/panel/PanelSelectCheckbox";
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
import type { PanelRowSelection } from "@/hooks/usePanelRowSelection";
import { orderReference } from "@/lib/tr/orderReference";
import {
  orderListDate,
  type OrderSortKey,
  type SortDirection,
} from "@/lib/tr/panel/orderList";
import { orderUnitCount } from "@/lib/tr/panel/orderView";
import { trPanelOrderPath } from "@/lib/tr/paths";
import { formatTryFromKurus, type TrOrderWithItems } from "@/types/tr-marketplace";

export interface OrderSort {
  key: OrderSortKey;
  direction: SortDirection;
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: OrderSortKey;
  sort: OrderSort;
  onSort: (column: OrderSortKey) => void;
}) {
  const active = sort.key === column;
  const Icon = !active
    ? ChevronsUpDown
    : sort.direction === "asc"
      ? ChevronUp
      : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      aria-label={`${label} sütununa göre sırala`}
      className={`-mx-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors duration-150 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] ${
        active ? "text-neutral-900" : ""
      }`}
    >
      {label}
      <Icon
        className={`h-3.5 w-3.5 ${active ? "text-[color:var(--panel-accent-deep)]" : "text-neutral-400"}`}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}

function ChannelCell({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-neutral-200 bg-neutral-50">
        <Store className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="max-w-[160px] truncate">{name}</span>
    </span>
  );
}

/**
 * The order list: a table on desktop (whole row opens the order, checkboxes pick
 * orders for bulk actions) and cards on phones. Everything you do to one order is
 * on its page.
 */
export function TrOrderListTable({
  orders,
  nowMs,
  boutiqueName,
  sort,
  onSort,
  selection,
  selectionDisabled,
  footer,
}: {
  orders: TrOrderWithItems[];
  nowMs: number;
  boutiqueName: string;
  sort: OrderSort;
  onSort: (column: OrderSortKey) => void;
  selection: PanelRowSelection;
  /** A bulk action is running: the selection can't change under it. */
  selectionDisabled: boolean;
  footer: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <>
      {/* Phones: one card per order. */}
      <div className="space-y-4 lg:hidden">
        <TrPanelStagger className="space-y-3">
          {orders.map((order) => {
            const when = orderListDate(order.createdAt, nowMs);
            return (
              <motion.div key={order.id} variants={trPanelStaggerItem}>
                <Link
                  href={trPanelOrderPath(order.id)}
                  className="block space-y-2.5 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-[color:var(--panel-accent-soft)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[15px] font-semibold text-neutral-900">
                      #{orderReference(order.id)}
                    </p>
                    <p className="text-[15px] font-semibold tabular-nums text-neutral-900">
                      {formatTryFromKurus(order.totalKurus)}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-[13px] text-neutral-600">
                    <p className="min-w-0 truncate">{order.customerName}</p>
                    <p className="shrink-0">
                      {when.day} {when.time}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TrOrderFulfillmentOutlineChip status={order.fulfillmentStatus} />
                    <TrOrderPaymentOutlineChip order={order} />
                    <span className="text-[12.5px] text-[color:var(--panel-accent-deep)]">
                      {orderUnitCount(order)} ürün
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </TrPanelStagger>
        <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3">
          {footer}
        </div>
      </div>

      {/* Desktop: a table, the whole row opens the order. */}
      <div className="hidden lg:block">
        <TrPanelDataTable
          contained={false}
          onKeyDown={selection.onKeyDown}
          selectAll={{
            checked: selection.allVisibleSelected,
            indeterminate:
              selection.someVisibleSelected && !selection.allVisibleSelected,
            onChange: selection.setAllVisible,
            disabled: selectionDisabled,
          }}
          headers={[
            "Sipariş",
            <SortHeader key="date" label="Tarih" column="date" sort={sort} onSort={onSort} />,
            "Müşteri",
            "Sipariş Durumu",
            "Ödeme Durumu",
            <SortHeader key="total" label="Toplam Tutar" column="total" sort={sort} onSort={onSort} />,
            "Satış Kanalı",
          ]}
          footer={footer}
        >
          {orders.map((order) => {
            const href = trPanelOrderPath(order.id);
            const when = orderListDate(order.createdAt, nowMs);
            return (
              <TrPanelDataTableRow
                key={order.id}
                selected={selection.isSelected(order.id)}
                onActivate={() => router.push(href)}
                onPointerEnter={() => router.prefetch(href)}
              >
                <TrPanelDataTableCell className="w-10">
                  <PanelSelectCheckbox
                    id={order.id}
                    checked={selection.isSelected(order.id)}
                    disabled={selectionDisabled}
                    label={`Sipariş ${orderReference(order.id)} seç`}
                    onItemClick={selection.onItemClick}
                  />
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <Link
                    href={href}
                    className="font-semibold text-neutral-900 hover:underline"
                  >
                    #{orderReference(order.id)}
                  </Link>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <p>{when.day}</p>
                  <p className="text-[12px] text-neutral-500">{when.time}</p>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <p className="max-w-[220px] truncate">{order.customerName}</p>
                  <p className="max-w-[220px] truncate text-[12px] text-neutral-500">
                    {order.customerEmail}
                  </p>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <TrOrderFulfillmentOutlineChip status={order.fulfillmentStatus} />
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <TrOrderPaymentOutlineChip order={order} />
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <p className="tabular-nums">{formatTryFromKurus(order.totalKurus)}</p>
                  <p className="text-[12px] text-[color:var(--panel-accent-deep)]">
                    {orderUnitCount(order)} ürün
                  </p>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <ChannelCell name={boutiqueName} />
                </TrPanelDataTableCell>
              </TrPanelDataTableRow>
            );
          })}
        </TrPanelDataTable>
      </div>
    </>
  );
}
