"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Info,
  Mail,
  Pencil,
  Phone,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  TrOrderFulfillmentOutlineChip,
  TrOrderPaymentOutlineChip,
} from "@/components/tr/panel/orders/TrOrderBadges";
import { formatOrderDateLong } from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelCardShellClass,
  panelErrorClass,
} from "@/components/tr/panel/panelUi";
import { formatDecimal } from "@/components/tr/panel/dashboard/dashboardFormat";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import {
  TrPanelEditor,
  TrPanelEditorActions,
} from "@/components/tr/panel/TrPanelEditor";
import {
  PANEL_PAGE_SIZES,
  TrPanelListPager,
} from "@/components/tr/panel/TrPanelListPager";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelPulse } from "@/components/tr/panel/TrPanelMotion";
import {
  usePanelBackTarget,
  usePanelSelfPath,
} from "@/components/tr/panel/usePanelOrigin";
import {
  indexCustomerStats,
  ordersOfCustomer,
} from "@/lib/tr/customers/customerModel";
import {
  adjacentCustomers,
  type CustomerRow,
} from "@/lib/tr/panel/customerList";
import { orderListDate } from "@/lib/tr/panel/orderList";
import { orderUnitCount } from "@/lib/tr/panel/orderView";
import { withPanelOrigin } from "@/lib/tr/panel/panelOrigin";
import {
  fetchOwnerCustomers,
  fetchOwnerOrders,
  peekOwnerCustomers,
  peekOwnerOrders,
} from "@/lib/tr/panel/ownerClient";
import { orderReference } from "@/lib/tr/orderReference";
import {
  trPanelCustomerPath,
  trPanelCustomersPath,
  trPanelEditCustomerPath,
  trPanelOrderPath,
} from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrBoutiqueCustomer,
  type TrBoutiqueCustomerAddress,
  type TrOrderWithItems,
} from "@/types/tr-marketplace";

const barButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-2.5 text-[13px] font-medium text-white/85 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 motion-reduce:transition-none";

function NeighbourLink({
  customerId,
  direction,
}: {
  customerId: string | null;
  direction: "previous" | "next";
}) {
  const label = direction === "previous" ? "Önceki müşteri" : "Sonraki müşteri";
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight;
  const icon = <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />;
  if (!customerId) {
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={`${label} yok`}
        className={`${barButtonClass} pointer-events-none opacity-40`}
      >
        {icon}
      </span>
    );
  }
  return (
    <Link
      href={trPanelCustomerPath(customerId)}
      aria-label={label}
      className={barButtonClass}
    >
      {icon}
    </Link>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <span title={text} className="text-neutral-400">
      <Info className="h-3.5 w-3.5" strokeWidth={1.75} aria-label={text} />
    </span>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5 lg:px-6 lg:first:pl-0 lg:last:pr-0">
      <p className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {label}
      </p>
      <div className="truncate text-[14px] font-medium text-neutral-900">{children}</div>
    </div>
  );
}

function Stat({
  label,
  hint,
  value,
}: {
  label: string;
  hint?: string;
  value: string;
}) {
  return (
    <div className="min-w-0 space-y-1 lg:px-6 lg:first:pl-0 lg:last:pr-0">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500">
        {label}
        {hint ? <InfoHint text={hint} /> : null}
      </p>
      <p className="text-[1.5rem] font-semibold tracking-tight tabular-nums text-neutral-900">
        {value}
      </p>
    </div>
  );
}

function AddressList({ addresses }: { addresses: TrBoutiqueCustomerAddress[] }) {
  if (addresses.length === 0) {
    return (
      <div className="px-4 py-8 text-center sm:px-6">
        <p className="text-[15px] font-semibold text-neutral-900">
          Müşteriye ait henüz bir adres yok
        </p>
        <p className="mt-1 text-[13.5px] text-neutral-500">
          Adres eklemek için düzenleye basınız
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-neutral-100">
      {addresses.map((address) => (
        <li key={address.id} className="space-y-0.5 px-4 py-4 sm:px-6">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
            {address.title}
            {address.isDefault ? (
              <span className="rounded bg-[color:var(--panel-accent-soft)] px-1.5 py-0.5 text-[11.5px] font-semibold text-[color:var(--panel-accent-deep)]">
                Varsayılan
              </span>
            ) : null}
          </p>
          <p className="text-[13.5px] text-neutral-700">{address.name}</p>
          <p className="text-[13px] leading-relaxed text-neutral-500">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.district}, {address.city} {address.postalCode}
          </p>
        </li>
      ))}
    </ul>
  );
}

function CustomerOrders({
  orders,
  boutiqueName,
  selfPath,
  nowMs,
}: {
  orders: TrOrderWithItems[];
  boutiqueName: string;
  selfPath: string;
  nowMs: number;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PANEL_PAGE_SIZES[0]);
  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const current = Math.min(page, pageCount);
  const items = orders.slice((current - 1) * pageSize, current * pageSize);

  const pager = (
    <TrPanelListPager
      page={current}
      pageCount={pageCount}
      pageSize={pageSize}
      total={orders.length}
      noun="sipariş"
      onPage={setPage}
      onPageSize={(value) => {
        setPageSize(value);
        setPage(1);
      }}
    />
  );

  const linkFor = (order: TrOrderWithItems) =>
    withPanelOrigin(trPanelOrderPath(order.id), selfPath);

  if (orders.length === 0) {
    return (
      <div className={`${panelCardShellClass} px-4 py-10 text-center sm:px-6`}>
        <p className="text-[15px] font-semibold text-neutral-900">Henüz sipariş yok</p>
        <p className="mt-1 text-[13.5px] text-neutral-500">
          Bu müşterinin siparişleri burada görünür.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Phones */}
      <div className="space-y-3 lg:hidden">
        {items.map((order) => {
          const when = orderListDate(order.createdAt, nowMs);
          return (
            <Link
              key={order.id}
              href={linkFor(order)}
              className="block space-y-2 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-[color:var(--panel-accent-soft)]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[14.5px] font-semibold text-neutral-900">
                  #{orderReference(order.id)}
                </p>
                <p className="text-[14.5px] font-semibold tabular-nums text-neutral-900">
                  {formatTryFromKurus(order.totalKurus)}
                </p>
              </div>
              <p className="text-[12.5px] text-neutral-500">
                {when.day} {when.time} · {orderUnitCount(order)} ürün
              </p>
              <div className="flex flex-wrap gap-2">
                <TrOrderFulfillmentOutlineChip status={order.fulfillmentStatus} />
                <TrOrderPaymentOutlineChip order={order} />
              </div>
            </Link>
          );
        })}
        <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3">
          {pager}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <TrPanelDataTable
          contained={false}
          headers={["Sipariş", "Toplam Tutar", "Tarih", "Sipariş Durumu", "Ödeme Durumu", "Satış Kanalı"]}
          footer={pager}
        >
          {items.map((order) => {
            const when = orderListDate(order.createdAt, nowMs);
            return (
              <TrPanelDataTableRow key={order.id}>
                <TrPanelDataTableCell>
                  <Link
                    href={linkFor(order)}
                    className="font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
                  >
                    #{orderReference(order.id)}
                  </Link>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <p className="tabular-nums">{formatTryFromKurus(order.totalKurus)}</p>
                  <p className="text-[12px] text-[color:var(--panel-accent-deep)]">
                    {orderUnitCount(order)} ürün
                  </p>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <p>{when.day}</p>
                  <p className="text-[12px] text-neutral-500">{when.time}</p>
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <TrOrderFulfillmentOutlineChip status={order.fulfillmentStatus} />
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <TrOrderPaymentOutlineChip order={order} />
                </TrPanelDataTableCell>
                <TrPanelDataTableCell>
                  <span className="inline-flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-neutral-200 bg-neutral-50">
                      <Store className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="max-w-[140px] truncate">{boutiqueName}</span>
                  </span>
                </TrPanelDataTableCell>
              </TrPanelDataTableRow>
            );
          })}
        </TrPanelDataTable>
      </div>
    </>
  );
}

function CustomerDetail({
  boutiqueId,
  boutiqueName,
  customerId,
}: {
  boutiqueId: string;
  boutiqueName: string;
  customerId: string;
}) {
  const back = usePanelBackTarget({ href: trPanelCustomersPath(), label: "Müşteriler" });
  const selfPath = usePanelSelfPath();
  const [customers, setCustomers] = useState<TrBoutiqueCustomer[] | null>(
    () => peekOwnerCustomers(boutiqueId) ?? null,
  );
  const [orders, setOrders] = useState<TrOrderWithItems[] | null>(
    () => peekOwnerOrders(boutiqueId) ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetchOwnerCustomers(boutiqueId).then(
      (result) => {
        if (!cancelled) setCustomers(result);
      },
      (loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Müşteri yüklenemedi.",
          );
        }
      },
    );
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
    return customers.map((customer) => ({ customer, stats: stats.get(customer.id)! }));
  }, [customers, orders, boutiqueId]);

  const row = rows.find((entry) => entry.customer.id === customerId) ?? null;
  const neighbours = adjacentCustomers(rows, customerId);
  const customerOrders = useMemo(
    () => (row && orders ? ordersOfCustomer(orders, row.customer) : []),
    [row, orders],
  );
  const notFound = customers !== null && orders !== null && row === null;

  return (
    <TrPanelEditor
      backHref={back.href}
      parentLabel={back.label}
      title="Müşteri Detayı"
      subject={row?.customer.name}
      width="wide"
    >
      {row ? (
        <TrPanelEditorActions>
          {back.fromElsewhere ? (
            <Link href={back.href} className={`${barButtonClass} sm:px-4`}>
              Kapat
            </Link>
          ) : (
            <>
              <NeighbourLink customerId={neighbours.previousId} direction="previous" />
              <NeighbourLink customerId={neighbours.nextId} direction="next" />
            </>
          )}
          <Link
            href={trPanelEditCustomerPath(row.customer.id)}
            className={`${barButtonClass} sm:px-4`}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Düzenle
          </Link>
        </TrPanelEditorActions>
      ) : null}

      {error && !row ? (
        <p className={`${panelErrorClass} mt-1`}>{error}</p>
      ) : notFound ? (
        <p className={`${panelErrorClass} mt-1`}>
          Müşteri bulunamadı.{" "}
          <Link href={trPanelCustomersPath()} className="font-semibold underline">
            Müşterilere dön
          </Link>
        </p>
      ) : !row ? (
        <div className="space-y-4 pt-1" role="status" aria-label="Müşteri yükleniyor">
          <TrPanelPulse className="h-36 w-full" />
          <TrPanelPulse className="h-24 w-full" />
          <TrPanelPulse className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <section className={panelCardShellClass}>
            <header className="flex items-center gap-2.5 border-b border-neutral-100 px-4 py-4 sm:px-6">
              <UserRound className="h-[18px] w-[18px] text-neutral-500" strokeWidth={1.75} aria-hidden />
              <h2 className="text-[16px] font-semibold text-neutral-900">
                {row.customer.name}
              </h2>
            </header>
            <div className="grid gap-5 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-neutral-100">
              <Fact icon={Mail} label="E-Posta">
                <a href={`mailto:${row.customer.email}`} className="hover:underline">
                  {row.customer.email}
                </a>
              </Fact>
              <Fact icon={Phone} label="Telefon Numarası">
                {row.customer.phone ? (
                  <a href={`tel:${row.customer.phone}`} className="hover:underline">
                    {row.customer.phone}
                  </a>
                ) : (
                  "-"
                )}
              </Fact>
              <Fact icon={CalendarClock} label="Üyelik Tarihi">
                {formatOrderDateLong(row.customer.createdAt)}
              </Fact>
              <Fact icon={ShoppingBag} label="Son Sipariş">
                {row.stats.lastOrderAt ? formatOrderDateLong(row.stats.lastOrderAt) : "-"}
              </Fact>
            </div>
          </section>

          <section className={`${panelCardShellClass} grid gap-5 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-neutral-100`}>
            <Stat
              label="Toplam Satış Tutarı"
              value={formatTryFromKurus(row.stats.spendKurus)}
            />
            <Stat label="Toplam Sipariş Sayısı" value={String(row.stats.orderCount)} />
            <Stat
              label="Ort. Sepet Tutarı"
              hint="Ödenmiş siparişlerin ortalama tutarı."
              value={formatTryFromKurus(row.stats.averageOrderKurus)}
            />
            <Stat
              label="Ort. Sepet Büyüklüğü"
              hint="Bir siparişteki ortalama ürün adedi."
              value={
                row.stats.orderCount === 0 ? "0" : formatDecimal(row.stats.itemsPerOrder)
              }
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0 space-y-4">
              <section className={panelCardShellClass}>
                <h2 className="border-b border-neutral-100 px-4 py-3.5 text-[15px] font-semibold text-neutral-900 sm:px-6">
                  Not
                </h2>
                <p className="px-4 py-4 text-[13.5px] leading-relaxed whitespace-pre-wrap text-neutral-700 sm:px-6">
                  {row.customer.note ?? <span className="text-neutral-400">Not eklenmemiş.</span>}
                </p>
              </section>
              <section className={panelCardShellClass}>
                <h2 className="border-b border-neutral-100 px-4 py-3.5 text-[15px] font-semibold text-neutral-900 sm:px-6">
                  Adresler
                </h2>
                <AddressList addresses={row.customer.addresses} />
              </section>
            </div>

            <div className="min-w-0 space-y-3">
              <h2 className="text-[15px] font-semibold text-neutral-900">Siparişler</h2>
              <CustomerOrders
                orders={customerOrders}
                boutiqueName={boutiqueName}
                selfPath={selfPath}
                nowMs={nowMs}
              />
            </div>
          </div>
        </div>
      )}
    </TrPanelEditor>
  );
}

export function TrOwnerCustomerDetailPage({ customerId }: { customerId: string }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <CustomerDetail
          key={`${activeBoutique.id}:${customerId}`}
          boutiqueId={activeBoutique.id}
          boutiqueName={activeBoutique.name}
          customerId={customerId}
        />
      )}
    </TrOwnerPanelGate>
  );
}
