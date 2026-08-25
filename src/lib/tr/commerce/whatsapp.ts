import { formatTryFromKurus } from "@/types/tr-marketplace";

export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppOrderUrl(phone: string, message: string): string {
  const digits = whatsappDigitsTr(phone);
  if (!digits) return "https://wa.me/";

  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${digits}?${params.toString()}`;
}

/** TR mobile → 90xxxxxxxxxx for wa.me */
export function whatsappDigitsTr(phone: string): string {
  const digits = normalizeWhatsAppPhone(phone);
  if (digits.startsWith("90") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) {
    return `90${digits.slice(1)}`;
  }
  if (digits.length === 10) return `90${digits}`;
  return digits;
}

export function buildSizeRestockNotifyMessage(product: {
  title: string;
  size: string;
}): string {
  return [
    "Merhaba, stok gelince haber vermenizi istiyorum.",
    "",
    `Ürün: ${product.title}`,
    `Beden: ${product.size}`,
  ].join("\n");
}

export function buildSizeHelpWhatsAppMessage(product: {
  title: string;
  size?: string | null;
}): string {
  const lines = [
    "Merhaba, bu ürünün bedeni hakkında bilgi almak istiyorum. Birlikte seçebilir miyiz?",
    "",
    `Ürün: ${product.title}`,
  ];
  const size = product.size?.trim();
  if (size) lines.push(`Beden: ${size}`);
  return lines.join("\n");
}

export function buildProductOrderMessage(product: {
  title: string;
  priceKurus: number;
  size?: string | null;
  color?: string | null;
}): string {
  const price = formatTryFromKurus(product.priceKurus);
  const sizeLine = product.size?.trim()
    ? `Beden: ${product.size.trim()}`
    : "Beden: ";
  const colorLine = product.color?.trim()
    ? `Renk: ${product.color.trim()}`
    : null;

  return [
    "Merhaba, sipariş vermek istiyorum.",
    "",
    `Ürün: ${product.title}`,
    `Fiyat: ${price}`,
    sizeLine,
    colorLine,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAddressCorrectionWhatsAppMessage(order: {
  customerName: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    district: string;
    city: string;
    postalCode: string;
  };
}): string {
  const addr = order.shippingAddress;
  const street = [addr.line1, addr.line2].filter(Boolean).join(" ");
  return [
    `Merhaba ${order.customerName},`,
    "",
    "Siparişinizin kargo adresi kargo firmaları tarafından kabul edilmedi.",
    "Mahalle, sokak, bina ve daire numarasını net yazıp bu mesaja yanıtlar mısınız?",
    "",
    `Kayıtlı adres: ${street}`,
    `${addr.district} / ${addr.city} ${addr.postalCode}`,
  ].join("\n");
}

export function instagramProfileUrl(handle: string): string {
  const normalized = handle.trim().replace(/^@/, "");
  return `https://www.instagram.com/${encodeURIComponent(normalized)}/`;
}
