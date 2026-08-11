import {
  trPanelCampaignsPath,
  trPanelContentPath,
  trPanelCustomersPath,
  trPanelInvoicesPath,
  trPanelNewProductPath,
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
  match: "exact" | "products" | "prefix" | "new-product";
}

/** Ikas-like merchant sidebar modules. */
export const TR_PANEL_NAV: TrPanelNavItem[] = [
  { href: trPanelPath(), label: "Ana Sayfa", match: "exact" },
  { href: trPanelOrdersPath(), label: "Siparişler", match: "prefix" },
  { href: trPanelProductsPath(), label: "Ürünler", match: "products" },
  { href: trPanelNewProductPath(), label: "Yeni ürün", match: "new-product" },
  { href: trPanelStockPath(), label: "Stok", match: "prefix" },
  { href: trPanelCustomersPath(), label: "Müşteriler", match: "prefix" },
  { href: trPanelCampaignsPath(), label: "Kampanyalar", match: "prefix" },
  { href: trPanelContentPath(), label: "İçerik", match: "prefix" },
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
  if (item.match === "new-product") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  if (item.match === "products") {
    const newProduct = trPanelNewProductPath();
    if (pathname === newProduct || pathname.startsWith(`${newProduct}/`)) {
      return false;
    }
    return (
      pathname === item.href ||
      pathname.startsWith("/tr/panel/urunler") ||
      pathname.startsWith("/tr/panel/urun/")
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
