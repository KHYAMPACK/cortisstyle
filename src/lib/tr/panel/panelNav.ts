import {
  trPanelCampaignsPath,
  trPanelCustomersPath,
  trPanelInvoicesPath,
  trPanelOrdersPath,
  trPanelPath,
  trPanelProductsPath,
  trPanelReportsPath,
  trPanelSettingsPath,
  trPanelStockPath,
} from "@/lib/tr/paths";

export interface TrPanelNavItem {
  href: string;
  label: string;
  /** Exact match for home; prefix match for nested product routes. */
  match: "exact" | "products" | "prefix";
  prefetch?: "products" | "orders";
}

/** Live owner-panel modules. Yeni ürün is a list CTA; İçerik stays a URL-only route. */
export const TR_PANEL_NAV: TrPanelNavItem[] = [
  { href: trPanelPath(), label: "Giriş", match: "exact" },
  {
    href: trPanelOrdersPath(),
    label: "Siparişler",
    match: "prefix",
    prefetch: "orders",
  },
  {
    href: trPanelProductsPath(),
    label: "Ürünler",
    match: "products",
    prefetch: "products",
  },
  {
    href: trPanelStockPath(),
    label: "Stok",
    match: "prefix",
    prefetch: "products",
  },
  { href: trPanelCustomersPath(), label: "Müşteriler", match: "prefix" },
  { href: trPanelCampaignsPath(), label: "İndirimler", match: "prefix" },
  { href: trPanelReportsPath(), label: "Raporlar", match: "prefix" },
  { href: trPanelSettingsPath(), label: "Ayarlar", match: "prefix" },
  { href: trPanelInvoicesPath(), label: "Faturalar", match: "prefix" },
];

export function isTrPanelNavActive(
  pathname: string,
  item: TrPanelNavItem,
): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  if (item.match === "products") {
    return (
      pathname === item.href ||
      pathname.startsWith("/tr/panel/urunler") ||
      pathname.startsWith("/tr/panel/urun/")
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
