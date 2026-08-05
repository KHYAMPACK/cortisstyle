import { formatTryFromKurus } from "@/types/tr-marketplace";

export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppOrderUrl(phone: string, message: string): string {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return "https://wa.me/";

  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${digits}?${params.toString()}`;
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

export function instagramProfileUrl(handle: string): string {
  const normalized = handle.trim().replace(/^@/, "");
  return `https://www.instagram.com/${encodeURIComponent(normalized)}/`;
}
