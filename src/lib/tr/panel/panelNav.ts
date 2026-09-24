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
import {
  catalogProfileCapabilities,
  normalizeCatalogProfile,
  resolveCatalogProfile,
  isCustomArtCatalogProfile,
  type TrCatalogProfileId,
} from "@/lib/tr/catalogProfiles";

/** One link in the panel menu. */
export interface TrPanelNavItem {
  href: string;
  label: string;
  /** Exact match for home; prefix match for nested product routes. */
  match: "exact" | "products" | "prefix";
  prefetch?: "products" | "orders";
}

/**
 * An expandable heading with its pages nested underneath (Ürünler → Ürünler, Stok, …).
 * The heading itself is not a link. To add a page to a group, add a child here, add
 * the route, and gate it in `panelNavForProfile` if some vertical shouldn't see it.
 */
export interface TrPanelNavGroup {
  id: string;
  label: string;
  children: TrPanelNavItem[];
}

export type TrPanelNavEntry = TrPanelNavItem | TrPanelNavGroup;

export function isPanelNavGroup(entry: TrPanelNavEntry): entry is TrPanelNavGroup {
  return "children" in entry;
}

/** Live owner-panel modules. Yeni ürün is a list CTA; İçerik stays a URL-only route. */
export const TR_PANEL_NAV: TrPanelNavEntry[] = [
  { href: trPanelPath(), label: "Giriş", match: "exact" },
  {
    href: trPanelOrdersPath(),
    label: "Siparişler",
    match: "prefix",
    prefetch: "orders",
  },
  {
    id: "products",
    label: "Ürünler",
    children: [
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
    ],
  },
  { href: trPanelCustomersPath(), label: "Müşteriler", match: "prefix" },
  { href: trPanelCampaignsPath(), label: "İndirimler", match: "prefix" },
  { href: trPanelReportsPath(), label: "Raporlar", match: "prefix" },
  { href: trPanelSettingsPath(), label: "Ayarlar", match: "prefix" },
  { href: trPanelInvoicesPath(), label: "Faturalar", match: "prefix" },
];

/**
 * The menu for a catalog profile. Pages a profile can't use are removed, and a
 * group whose pages are all removed disappears with them.
 */
export function panelNavForProfile(
  profile: TrCatalogProfileId = "fashion",
): TrPanelNavEntry[] {
  const caps = catalogProfileCapabilities(profile);
  const visible = (item: TrPanelNavItem): boolean => {
    if (item.href === trPanelProductsPath() && !caps.showProductsNav) {
      return false;
    }
    if (item.href === trPanelStockPath() && !caps.showStockNav) {
      return false;
    }
    return true;
  };

  return TR_PANEL_NAV.flatMap((entry): TrPanelNavEntry[] => {
    if (!isPanelNavGroup(entry)) return visible(entry) ? [entry] : [];
    const children = entry.children.filter(visible);
    return children.length > 0 ? [{ ...entry, children }] : [];
  });
}

/** Every link in menu order, groups expanded — for the mobile tab bar. */
export function flattenPanelNav(entries: TrPanelNavEntry[]): TrPanelNavItem[] {
  return entries.flatMap((entry) =>
    isPanelNavGroup(entry) ? entry.children : [entry],
  );
}

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

export function isTrPanelNavGroupActive(
  pathname: string,
  group: TrPanelNavGroup,
): boolean {
  return group.children.some((child) => isTrPanelNavActive(pathname, child));
}

export type { TrCatalogProfileId };
export {
  catalogProfileCapabilities,
  isCustomArtCatalogProfile,
  normalizeCatalogProfile,
  resolveCatalogProfile,
};

/**
 * Full-screen editor routes. The shell hides the sidebar and tab bar on these and
 * the page draws its own top bar (`TrPanelEditor`). Add a route here when a new
 * editor page is built. The bulk and set wizards under /urun/ keep the normal chrome.
 */
const PANEL_EDITOR_ROUTES: RegExp[] = [
  /^\/tr\/panel\/urun\/yeni\/?$/,
  /^\/tr\/panel\/urun\/(?!takim\/?$|toplu\/?$)[^/]+\/?$/,
];

export function isPanelEditorRoute(pathname: string): boolean {
  return PANEL_EDITOR_ROUTES.some((route) => route.test(pathname));
}

export function isPanelProductRoute(pathname: string): boolean {
  return (
    pathname === trPanelProductsPath() ||
    pathname.startsWith("/tr/panel/urunler") ||
    pathname.startsWith("/tr/panel/urun/") ||
    pathname === trPanelStockPath() ||
    pathname.startsWith(`${trPanelStockPath()}/`)
  );
}
