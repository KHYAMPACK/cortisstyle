import {
  FULFILLMENT_LABEL,
  PAYMENT_LABEL,
} from "@/components/tr/panel/orderFulfillmentUi";
import { orderPaymentKey } from "@/lib/tr/panel/orderView";
import type {
  TrFulfillmentStatus,
  TrOrder,
  TrPaymentStatus,
} from "@/types/tr-marketplace";

type Tone = "amber" | "sky" | "violet" | "emerald" | "red" | "neutral";

const FULFILLMENT_TONE_OF: Record<TrFulfillmentStatus, Tone> = {
  created: "amber",
  ready: "sky",
  shipped: "violet",
  delivered: "emerald",
  cancelled: "neutral",
};

const PAYMENT_TONE_OF: Record<TrPaymentStatus, Tone> = {
  paid: "emerald",
  pending: "amber",
  failed: "red",
  refunded: "neutral",
  sandbox: "neutral",
};

/** Outlined chips for the dark editor top bar. */
const ON_DARK: Record<Tone, string> = {
  amber: "border-amber-400/50 text-amber-300",
  sky: "border-sky-400/50 text-sky-300",
  violet: "border-violet-400/50 text-violet-300",
  emerald: "border-emerald-400/50 text-emerald-300",
  red: "border-red-400/50 text-red-300",
  neutral: "border-white/25 text-white/60",
};

/** Soft chips for white cards. */
const ON_LIGHT: Record<Tone, string> = {
  amber: "bg-amber-50 text-amber-900",
  sky: "bg-sky-50 text-sky-900",
  violet: "bg-violet-50 text-violet-900",
  emerald: "bg-emerald-50 text-emerald-900",
  red: "bg-red-50 text-red-800",
  neutral: "bg-neutral-100 text-neutral-600",
};

/** Outlined chips for tables and lists on the light canvas. */
const OUTLINE_LIGHT: Record<Tone, string> = {
  amber: "border-amber-300 bg-amber-50 text-amber-800",
  sky: "border-sky-300 bg-sky-50 text-sky-800",
  violet: "border-violet-300 bg-violet-50 text-violet-800",
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
  red: "border-red-300 bg-red-50 text-red-700",
  neutral: "border-neutral-300 bg-neutral-50 text-neutral-600",
};

const outlineChip =
  "inline-block rounded border px-2 py-0.5 text-[12px] leading-5 font-medium whitespace-nowrap";

/** Fulfilment status as an outlined chip, for the order list. */
export function TrOrderFulfillmentOutlineChip({
  status,
}: {
  status: TrFulfillmentStatus;
}) {
  return (
    <span className={`${outlineChip} ${OUTLINE_LIGHT[FULFILLMENT_TONE_OF[status]]}`}>
      {FULFILLMENT_LABEL[status]}
    </span>
  );
}

/** Payment status as an outlined chip, for the order list. */
export function TrOrderPaymentOutlineChip({
  order,
}: {
  order: Pick<TrOrder, "isSandbox" | "paymentStatus">;
}) {
  const payment = orderPaymentKey(order);
  return (
    <span className={`${outlineChip} ${OUTLINE_LIGHT[PAYMENT_TONE_OF[payment]]}`}>
      {PAYMENT_LABEL[payment]}
    </span>
  );
}

/** Fulfilment and payment status as two chips next to the title in the top bar. */
export function TrOrderTopBadges({
  order,
}: {
  order: Pick<TrOrder, "fulfillmentStatus" | "isSandbox" | "paymentStatus">;
}) {
  const payment = orderPaymentKey(order);
  const chip =
    "rounded-md border px-2 py-0.5 text-[12px] leading-5 font-medium whitespace-nowrap";
  return (
    <>
      <span
        className={`${chip} ${ON_DARK[FULFILLMENT_TONE_OF[order.fulfillmentStatus]]}`}
      >
        {FULFILLMENT_LABEL[order.fulfillmentStatus]}
      </span>
      <span className={`${chip} ${ON_DARK[PAYMENT_TONE_OF[payment]]}`}>
        {PAYMENT_LABEL[payment]}
      </span>
    </>
  );
}

/** The payment status as a soft chip inside a card. */
export function TrOrderPaymentChip({
  order,
}: {
  order: Pick<TrOrder, "isSandbox" | "paymentStatus">;
}) {
  const payment = orderPaymentKey(order);
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${ON_LIGHT[PAYMENT_TONE_OF[payment]]}`}
    >
      {PAYMENT_LABEL[payment]}
    </span>
  );
}
