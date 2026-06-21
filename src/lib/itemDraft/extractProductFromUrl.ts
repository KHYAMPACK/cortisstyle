import type { ProductPageHints } from "@/lib/itemDraft/types";

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)));
}

function metaContent(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return undefined;
}

function parseJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return blocks;
}

function walkJsonLd(
  node: unknown,
  visit: (obj: Record<string, unknown>) => void,
): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) walkJsonLd(child, visit);
    return;
  }
  visit(node as Record<string, unknown>);
  for (const value of Object.values(node)) {
    walkJsonLd(value, visit);
  }
}

function pickProductFromJsonLd(blocks: unknown[]): ProductPageHints {
  const hints: ProductPageHints = { rawJsonLd: blocks };
  const products: Record<string, unknown>[] = [];

  for (const block of blocks) {
    walkJsonLd(block, (obj) => {
      const type = obj["@type"];
      const types = Array.isArray(type) ? type : type ? [type] : [];
      if (types.some((t) => String(t).toLowerCase().includes("product"))) {
        products.push(obj);
      }
    });
  }

  const product = products[0];
  if (!product) return hints;

  if (typeof product.name === "string") hints.title = product.name;
  if (typeof product.description === "string") {
    hints.description = product.description.slice(0, 1200);
  }
  if (typeof product.brand === "string") hints.brand = product.brand;
  if (product.brand && typeof product.brand === "object") {
    const brandName = (product.brand as { name?: string }).name;
    if (brandName) hints.brand = brandName;
  }
  if (typeof product.material === "string") hints.materials = product.material;

  const offers = product.offers;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  if (offer && typeof offer === "object") {
    const price = (offer as { price?: string | number }).price;
    const currency = (offer as { priceCurrency?: string }).priceCurrency;
    if (price != null) hints.price = String(price);
    if (currency) hints.currency = currency;
  }

  return hints;
}

/** Fetches a product page and extracts non-stock editorial hints (JSON-LD + Open Graph). */
export async function extractProductFromUrl(url: string): Promise<ProductPageHints> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "CortisstyleItemDraft/1.0 (+https://cortisstyle.com; product metadata enrichment)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product URL (${response.status}): ${url}`);
  }

  const html = await response.text();
  const jsonLd = parseJsonLdBlocks(html);
  const fromJsonLd = pickProductFromJsonLd(jsonLd);

  return {
    ...fromJsonLd,
    title: fromJsonLd.title ?? metaContent(html, "og:title") ?? metaContent(html, "twitter:title"),
    description:
      fromJsonLd.description ??
      metaContent(html, "og:description") ??
      metaContent(html, "description"),
    brand: fromJsonLd.brand ?? metaContent(html, "product:brand"),
    price:
      fromJsonLd.price ??
      metaContent(html, "product:price:amount") ??
      metaContent(html, "og:price:amount"),
    currency:
      fromJsonLd.currency ??
      metaContent(html, "product:price:currency") ??
      metaContent(html, "og:price:currency"),
  };
}
