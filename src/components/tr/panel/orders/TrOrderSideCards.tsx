"use client";

import NextLink from "next/link";
import { Store } from "lucide-react";
import { formatOrderDateLong } from "@/components/tr/panel/orderFulfillmentUi";
import { TrOrderPaymentChip } from "@/components/tr/panel/orders/TrOrderBadges";
import {
  panelCardClass,
  panelHintClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  orderPaymentKey,
  orderPaymentMethod,
  orderShippingKurus,
  orderSubtotalKurus,
} from "@/lib/tr/panel/orderView";
import { formatTryFromKurus, type TrOrderWithItems } from "@/types/tr-marketplace";

function MoneyRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
      <dt className={muted ? "text-neutral-500" : "text-neutral-700"}>{label}</dt>
      <dd className="tabular-nums text-neutral-900">{value}</dd>
    </div>
  );
}

/** When it was placed, where, and how the total is made up. */
export function TrOrderSummaryCard({
  order,
  boutiqueName,
  storefrontHref,
}: {
  order: TrOrderWithItems;
  boutiqueName: string;
  storefrontHref: string;
}) {
  const shipping = orderShippingKurus(order);

  return (
    <section className={`${panelCardClass} space-y-4`}>
      <h2 className="text-[16px] font-semibold text-neutral-900">Sipariş Özeti</h2>
      <div className="space-y-2 text-[13.5px]">
        <p className="text-neutral-700">{formatOrderDateLong(order.createdAt)}</p>
        <NextLink
          href={storefrontHref}
          target="_blank"
          rel="noopener"
          prefetch={false}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 hover:underline"
        >
          <Store className="h-4 w-4 text-neutral-400" strokeWidth={1.75} aria-hidden />
          {boutiqueName}
        </NextLink>
      </div>

      <dl className="space-y-2.5 border-t border-neutral-100 pt-4">
        <MoneyRow
          label="Ara toplam"
          value={formatTryFromKurus(orderSubtotalKurus(order))}
          muted
        />
        {order.discountKurus > 0 ? (
          <MoneyRow
            label={`İndirim${order.discountCode ? ` (${order.discountCode})` : ""}`}
            value={`−${formatTryFromKurus(order.discountKurus)}`}
            muted
          />
        ) : null}
        <MoneyRow
          label="Kargo"
          value={shipping > 0 ? formatTryFromKurus(shipping) : "Ücretsiz"}
          muted
        />
      </dl>
      <div className="flex items-baseline justify-between gap-3 border-t border-neutral-100 pt-4">
        <span className="text-[14px] font-semibold text-neutral-900">Toplam</span>
        <span className="text-[1.1rem] font-semibold tabular-nums text-neutral-900">
          {formatTryFromKurus(order.totalKurus)}
        </span>
      </div>
    </section>
  );
}

function paymentAmountLabel(order: TrOrderWithItems): string {
  const key = orderPaymentKey(order);
  if (key === "paid" || key === "sandbox") return "Alınan ödeme";
  if (key === "refunded") return "İade edilen tutar";
  return "Beklenen ödeme";
}

/** How the order is paid for. Owners of boutiques without card payments confirm it here. */
export function TrOrderPaymentCard({
  order,
  canMarkPaid,
  busy,
  onMarkPaid,
}: {
  order: TrOrderWithItems;
  canMarkPaid: boolean;
  busy: boolean;
  onMarkPaid: () => void;
}) {
  const key = orderPaymentKey(order);

  return (
    <section className={`${panelCardClass} space-y-4`}>
      <h2 className="text-[16px] font-semibold text-neutral-900">Ödemeler</h2>
      <div className="space-y-3 rounded-lg bg-neutral-50 p-4">
        <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
          <span className="text-neutral-600">{paymentAmountLabel(order)}</span>
          <span className="text-[1.05rem] font-semibold tabular-nums text-neutral-900">
            {formatTryFromKurus(order.totalKurus)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[13.5px]">
          <span className="text-neutral-600">Ödeme durumu</span>
          <TrOrderPaymentChip order={order} />
        </div>
        {key !== "sandbox" ? (
          <div className="flex items-center justify-between gap-3 text-[13.5px]">
            <span className="text-neutral-600">Ödeme yöntemi</span>
            <span className="font-medium text-neutral-900">
              {orderPaymentMethod(order) === "card" ? "Kart" : "Havale / manuel"}
            </span>
          </div>
        ) : null}
      </div>

      {canMarkPaid ? (
        <div className="space-y-3">
          <p className={panelHintClass}>
            Kart ödemesi açık değil. Havale / WhatsApp ile tahsil ettiğinizde
            “Ödendi” işaretleyin; sonra paketleyin.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={onMarkPaid}
            className={`${panelSecondaryBtnClass} w-full`}
          >
            Ödendi olarak işaretle
          </button>
        </div>
      ) : null}
    </section>
  );
}
