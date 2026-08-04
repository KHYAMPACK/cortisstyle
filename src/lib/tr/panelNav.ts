import {
  trPanelCampaignsPath,
  trPanelCustomersPath,
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
}

/** Ikas-like merchant sidebar modules. */
export const TR_PANEL_NAV: TrPanelNavItem[] = [
  { href: trPanelPath(), label: "Ana Sayfa", match: "exact" },
  { href: trPanelProductsPath(), label: "Ürünler", match: "products" },
  { href: trPanelStockPath(), label: "Stok", match: "prefix" },
  { href: trPanelOrdersPath(), label: "Siparişler", match: "prefix" },
  { href: trPanelCustomersPath(), label: "Müşteriler", match: "prefix" },
  { href: trPanelCampaignsPath(), label: "Kampanyalar", match: "prefix" },
  { href: trPanelReportsPath(), label: "Raporlar", match: "prefix" },
  { href: trPanelSettingsPath(), label: "Ayarlar", match: "prefix" },
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
      pathname.startsWith("/tr/panel/urun/") ||
      pathname.startsWith("/tr/panel/urunler")
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
