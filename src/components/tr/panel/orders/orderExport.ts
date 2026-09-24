import {
  FULFILLMENT_LABEL,
  PAYMENT_LABEL,
} from "@/components/tr/panel/orderFulfillmentUi";
import { orderReference } from "@/lib/tr/orderReference";
import { istanbulDayString } from "@/lib/tr/panel/dashboardRange";
import {
  orderPaymentKey,
  orderPaymentMethod,
  orderShippingKurus,
  orderSubtotalKurus,
  orderUnitCount,
} from "@/lib/tr/panel/orderView";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

/**
 * "Dışa Aktar": the listed orders as a CSV that opens correctly in Turkish Excel —
 * semicolon separators, comma decimals, a UTF-8 byte-order mark so ç ğ ı ö ş ü
 * survive, and CRLF line ends.
 */

const SEPARATOR = ";";

const HEADERS = [
  "Sipariş No",
  "Tarih",
  "Müşteri",
  "E-posta",
  "Telefon",
  "Sipariş Durumu",
  "Ödeme Durumu",
  "Ödeme Yöntemi",
  "Ürünler",
  "Ürün Adedi",
  "Ara Toplam",
  "İndirim",
  "Kargo",
  "Toplam",
  "İl",
  "İlçe",
  "Adres",
  "Posta Kodu",
];

/** A phone number typed the usual way can't run as a formula, so it stays as written. */
const PLAIN_PHONE = /^\+\d[\d ]*$/;

function quoted(text: string): string {
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Customers type most of these fields, and a spreadsheet runs a cell that starts
 * with = + - or @ as a formula. Prefixing an apostrophe makes it plain text.
 */
function text(value: string, { allowPhone = false } = {}): string {
  const clean = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ");
  const risky =
    /^[=+\-@\t\r]/.test(clean) && !(allowPhone && PLAIN_PHONE.test(clean));
  return quoted(risky ? `'${clean}` : clean);
}

function money(kurus: number): string {
  return (kurus / 100).toFixed(2).replace(".", ",");
}

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function ordersToCsv(orders: readonly TrOrderWithItems[]): string {
  const lines = orders.map((order) => {
    const address = order.shippingAddress;
    const products = order.items
      .map(
        (item) =>
          `${item.quantity} × ${item.title}${item.size ? ` (${item.size})` : ""}`,
      )
      .join("; ");
    return [
      text(orderReference(order.id)),
      text(dateFormat.format(new Date(order.createdAt))),
      text(order.customerName),
      text(order.customerEmail),
      text(order.customerPhone ?? "", { allowPhone: true }),
      text(FULFILLMENT_LABEL[order.fulfillmentStatus]),
      text(PAYMENT_LABEL[orderPaymentKey(order)]),
      text(orderPaymentMethod(order) === "card" ? "Kart" : "Havale / manuel"),
      text(products),
      String(orderUnitCount(order)),
      money(orderSubtotalKurus(order)),
      money(order.discountKurus),
      money(orderShippingKurus(order)),
      money(order.totalKurus),
      text(address.city),
      text(address.district),
      text(`${address.line1}${address.line2 ? ` ${address.line2}` : ""}`),
      text(address.postalCode),
    ].join(SEPARATOR);
  });
  return [HEADERS.map((header) => text(header)).join(SEPARATOR), ...lines].join(
    "\r\n",
  ) + "\r\n";
}

export function orderExportFilename(nowMs: number): string {
  return `siparisler-${istanbulDayString(nowMs)}.csv`;
}

/** Saves the CSV through the browser's download. */
export function downloadOrdersCsv(orders: readonly TrOrderWithItems[]): void {
  const blob = new Blob(["﻿", ordersToCsv(orders)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = orderExportFilename(Date.now());
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
