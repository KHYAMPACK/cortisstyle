import type { ClothingCategory } from "@/types/item";
import type { ProductPageHints } from "@/lib/itemDraft/types";

export interface KnownItemContext {
  name: string;
  shopUrl: string;
  hints: ProductPageHints;
  brandOverride?: string;
  category: ClothingCategory;
  brand: string;
  retailer: string;
  urlFetchFailed: boolean;
}

/** Best-effort brand from "Brand - Product" / "Brand | Product" patterns. */
export function inferBrandFromName(name: string): string | undefined {
  const patterns = [
    /^(.+?)\s[-–—|]\s+.+/,
    /^(.+?)\s+x\s+.+/i,
  ];
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match?.[1]) {
      const brand = match[1].trim();
      if (brand.length >= 2 && brand.length <= 40) return brand;
    }
  }
  return undefined;
}

export function inferRetailerFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const map: Record<string, string> = {
      "item.rakuten.co.jp": "Rakuten Japan",
      "rakuten.co.jp": "Rakuten Japan",
      "zara.com": "Zara",
      "uniqlo.com": "Uniqlo",
      "asos.com": "ASOS",
      "grailed.com": "Grailed",
      "depop.com": "Depop",
      "shopier.com": "Shopier",
      "farfetch.com": "Farfetch",
      "ssense.com": "SSENSE",
    };
    for (const [key, label] of Object.entries(map)) {
      if (host.includes(key)) return label;
    }
    return host;
  } catch {
    return "online retailer";
  }
}

export function inferCategoryFromName(name: string): ClothingCategory {
  const n = name.toLowerCase();
  if (/(sunglass|eyewear|glasses)/.test(n)) return "eyewear";
  if (/(beanie|cap|hat|bucket|knit cap|beret)/.test(n)) return "headwear";
  if (/(jacket|coat|blazer|overshirt|parka)/.test(n)) return "outerwear";
  if (/(jean|denim|pant|trouser|short|skirt)/.test(n)) return "bottoms";
  if (/(sneaker|boot|shoe|loafer|heel|trainer|runner)/.test(n)) return "shoes";
  if (/(bag|tote|backpack)/.test(n)) return "bags";
  if (/(bracelet|belt|waist)/.test(n)) return "waist";
  if (/(shirt|tee|top|tank|hoodie|sweater|knit|compression)/.test(n)) {
    return "tops";
  }
  if (/(necklace|ring|earring)/.test(n)) return "accessories";
  return "accessories";
}

export function inferBrandFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const depopMatch = pathname.match(/\/products\/[^/]*?y2k-1st-kiss/i);
    if (depopMatch) return "1st Kiss";

    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    const tokens = slug
      .replace(/^[^a-z0-9]+/i, "")
      .split("-")
      .filter((part) => part.length > 2 && !/^\d+$/.test(part));

    if (tokens.length >= 2) {
      const brandish = tokens
        .slice(-3, -1)
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
        .join(" ");
      if (brandish.length >= 3 && brandish.length <= 32) return brandish;
    }
  } catch {
    // ignore invalid URLs
  }
  return undefined;
}

export function buildKnownItemContext(input: {
  name: string;
  shopUrl: string;
  hints: ProductPageHints;
  brandOverride?: string;
  urlFetchFailed?: boolean;
}): KnownItemContext {
  const category = inferCategoryFromName(input.name);
  const brand =
    input.brandOverride ??
    input.hints.brand ??
    inferBrandFromName(input.name) ??
    inferBrandFromUrl(input.shopUrl) ??
    "Unknown Brand";

  return {
    name: input.name,
    shopUrl: input.shopUrl,
    hints: input.hints,
    brandOverride: input.brandOverride,
    category,
    brand,
    retailer: inferRetailerFromUrl(input.shopUrl),
    urlFetchFailed: input.urlFetchFailed ?? false,
  };
}

export function formatKnownContextForPrompt(ctx: KnownItemContext): string {
  const lines = [
    `Exact product name (canonical, do not rename): ${ctx.name}`,
    `Shop URL: ${ctx.shopUrl}`,
    `Retailer / domain hint: ${ctx.retailer}`,
    `Inferred category hint: ${ctx.category}`,
    `Inferred brand hint: ${ctx.brand}`,
  ];

  if (ctx.brandOverride) {
    lines.push(`Brand override (must use): ${ctx.brandOverride}`);
  }
  if (ctx.hints.title) lines.push(`Page title (scraped): ${ctx.hints.title}`);
  if (ctx.hints.description) {
    lines.push(`Page description (scraped): ${ctx.hints.description.slice(0, 800)}`);
  }
  if (ctx.hints.materials) lines.push(`Materials (scraped): ${ctx.hints.materials}`);
  if (ctx.hints.price) {
    lines.push(
      `Retail price (scraped): ${ctx.hints.currency ?? ""} ${ctx.hints.price}`.trim(),
    );
  }
  if (ctx.urlFetchFailed) {
    lines.push(
      "Page scrape failed — no HTML metadata available. Infer missing details from the product name, shop URL domain, and garment image. Make your best editorial guess; do not leave generic placeholders.",
    );
  }

  return lines.join("\n");
}
