/**
 * Where an editor page was reached from, so its back arrow and crumb can return
 * there ("Müşteri Detayı › Sipariş #1001") instead of always going to the list.
 *
 * A link from one panel page to another carries `?from=<the page it left>`. The
 * value is only ever used as an in-app link, so it is accepted only if it points
 * inside the panel; the label is looked up here, never taken from the URL.
 */

export const PANEL_ORIGIN_PARAM = "from";

const PANEL_ROOT = "/tr/panel";
const MAX_ORIGIN_LENGTH = 600;

/** Pages that can be a "came from" target, and what the crumb calls them. */
const ORIGIN_LABELS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/tr\/panel\/?$/, "Giriş"],
  [/^\/tr\/panel\/siparisler\/?$/, "Siparişler"],
  [/^\/tr\/panel\/siparisler\/yeni\/?$/, "Yeni Sipariş"],
  [/^\/tr\/panel\/siparisler\/[^/]+\/?$/, "Sipariş Detayı"],
  [/^\/tr\/panel\/taslaklar\/?$/, "Taslaklar"],
  [/^\/tr\/panel\/taslaklar\/[^/]+\/?$/, "Taslak Sipariş"],
  [/^\/tr\/panel\/musteriler\/?$/, "Müşteriler"],
  [/^\/tr\/panel\/musteriler\/[^/]+\/?$/, "Müşteri Detayı"],
  [/^\/tr\/panel\/urunler\/?$/, "Ürünler"],
  [/^\/tr\/panel\/stok\/?$/, "Stok"],
  [/^\/tr\/panel\/raporlar\/?$/, "Raporlar"],
];

/**
 * The origin as an in-panel path (with its own query, which may carry a further
 * `from`), or null if it is missing or could point anywhere else.
 */
export function parsePanelOrigin(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (value.length > MAX_ORIGIN_LENGTH) return null;
  // Control characters, backslashes and whitespace have no place in a panel path.
  if (/[\u0000- \\]/.test(value)) return null;
  if (!value.startsWith(PANEL_ROOT)) return null;
  // "/tr/panel" itself, or a real sub-path or query — not "/tr/panelx" or "/tr/panel.evil".
  const next = value.charAt(PANEL_ROOT.length);
  if (next !== "" && next !== "/" && next !== "?") return null;
  return value;
}

/** What to call the page an origin path points at, or null if it isn't one we know. */
export function panelOriginLabel(origin: string): string | null {
  const pathname = origin.split("?")[0] ?? "";
  for (const [pattern, label] of ORIGIN_LABELS) {
    if (pattern.test(pathname)) return label;
  }
  return null;
}

/** `href` with `?from=<originPath>` added, keeping any query it already has. */
export function withPanelOrigin(href: string, originPath: string): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${PANEL_ORIGIN_PARAM}=${encodeURIComponent(originPath)}`;
}
