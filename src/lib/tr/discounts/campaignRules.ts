import type {
  TrDiscountCampaign,
  TrDiscountCampaignCode,
  TrDiscountKind,
  TrDiscountType,
} from "@/lib/tr/discounts/types";
import { readDiscountKind, readDiscountType } from "@/lib/tr/discounts/types";

/**
 * Discount campaign rules: validating what an owner submits (`readCampaignBody`), and
 * deciding what a cart owes (`campaignMatchesCart`, `resolveAutomaticDiscount`,
 * `evaluateCodeRedemption`). Pure — no I/O, no dates read from `Date.now()` except
 * where a "now" is passed in, so every rule is deterministically testable. The
 * database side (loading campaigns, counting a customer's past uses) is
 * `catalog/discountCampaigns.ts`.
 */

export const CAMPAIGN_LIMITS = {
  titleMax: 80,
  percentMin: 1,
  percentMax: 100,
  /** 999.999,00 TL, in kuruş — the same ceiling product prices use. */
  amountOffMaxKurus: 99_999_900,
  subtotalMaxKurus: 99_999_900,
  itemsMax: 9_999,
  usageLimitMax: 1_000_000,
} as const;

// ---------------------------------------------------------------- validating a campaign

/** What an owner submits for a campaign's own fields (not its codes — see below). */
export interface CampaignInput {
  kind: TrDiscountKind;
  title: string;
  discountType: TrDiscountType;
  percentOff: number | null;
  amountOffKurus: number | null;
  scopeAll: boolean;
  productIds: string[];
  includeSaleItems: boolean;
  minSubtotalKurus: number | null;
  maxSubtotalKurus: number | null;
  minItems: number | null;
  maxItems: number | null;
  stackable: boolean;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

function readTitle(value: unknown): string {
  const title = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!title) throw new Error("İndirim başlığı zorunlu.");
  if (title.length > CAMPAIGN_LIMITS.titleMax) {
    throw new Error(`İndirim başlığı en fazla ${CAMPAIGN_LIMITS.titleMax} karakter olabilir.`);
  }
  return title;
}

/** A positive integer within `[min, max]`, or throws with `label`. `null`/`""` → null. */
function readOptionalInt(
  value: unknown,
  label: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {},
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${label} geçersiz.`);
  }
  return n;
}

function readRange(
  min: number | null,
  max: number | null,
  label: string,
): void {
  if (min !== null && max !== null && min > max) {
    throw new Error(`${label} için minimum, maksimumdan büyük olamaz.`);
  }
}

function readTimestamp(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error(`${label} geçersiz.`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${label} geçersiz.`);
  return parsed.toISOString();
}

/**
 * Validates the campaign body an owner submits (the shared tabs: Başlık, İndirim
 * Türü/Oranı, Koşullar, Gereksinimler, Kullanım Limitleri, Ayarlar, Aktif Tarihler).
 * Amounts are already in kuruş — the panel form converts TRY input before calling
 * this, the same way the product form does. Throws an `Error` with a sentence for
 * the owner when something is invalid.
 */
export function readCampaignBody(body: Record<string, unknown>): CampaignInput {
  const kind = readDiscountKind(body.kind);
  if (!kind) throw new Error("Kampanya türünü seçin.");

  const title = readTitle(body.title);

  const discountType = readDiscountType(body.discountType);
  if (!discountType) throw new Error("İndirim türünü seçin.");

  let percentOff: number | null = null;
  let amountOffKurus: number | null = null;
  if (discountType === "percent") {
    percentOff = readOptionalInt(body.percentOff, "İndirim oranı", {
      min: CAMPAIGN_LIMITS.percentMin,
      max: CAMPAIGN_LIMITS.percentMax,
    });
    if (percentOff === null) throw new Error("İndirim oranı zorunlu.");
  } else if (discountType === "fixed") {
    amountOffKurus = readOptionalInt(body.amountOffKurus, "İndirim tutarı", {
      min: 1,
      max: CAMPAIGN_LIMITS.amountOffMaxKurus,
    });
    if (amountOffKurus === null) throw new Error("İndirim tutarı zorunlu.");
  }
  // free_shipping carries no rate.

  const scopeAll = body.scopeAll !== false;
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string" && id !== "")
    : [];
  if (!scopeAll && productIds.length === 0) {
    throw new Error("Belirli ürünler seçtiyseniz en az bir ürün ekleyin.");
  }

  const minSubtotalKurus = readOptionalInt(body.minSubtotalKurus, "Minimum satın alma tutarı", {
    max: CAMPAIGN_LIMITS.subtotalMaxKurus,
  });
  const maxSubtotalKurus = readOptionalInt(body.maxSubtotalKurus, "Maksimum satın alma tutarı", {
    max: CAMPAIGN_LIMITS.subtotalMaxKurus,
  });
  readRange(minSubtotalKurus, maxSubtotalKurus, "Satın alma tutarı");

  const minItems = readOptionalInt(body.minItems, "Minimum ürün adedi", {
    min: 1,
    max: CAMPAIGN_LIMITS.itemsMax,
  });
  const maxItems = readOptionalInt(body.maxItems, "Maksimum ürün adedi", {
    min: 1,
    max: CAMPAIGN_LIMITS.itemsMax,
  });
  readRange(minItems, maxItems, "Ürün adedi");

  const usageLimitTotal = readOptionalInt(body.usageLimitTotal, "Toplam kullanım limiti", {
    min: 1,
    max: CAMPAIGN_LIMITS.usageLimitMax,
  });
  const usageLimitPerCustomer = readOptionalInt(
    body.usageLimitPerCustomer,
    "Müşteri başına kullanım limiti",
    { min: 1, max: CAMPAIGN_LIMITS.usageLimitMax },
  );
  if (kind === "code" && (usageLimitTotal !== null || usageLimitPerCustomer !== null)) {
    // A code campaign limits each of its codes instead (see readCodeLimitsBody).
    throw new Error("Kod kampanyalarında kullanım limiti kuponlarda ayarlanır.");
  }

  const startsAt = readTimestamp(body.startsAt, "Başlangıç tarihi");
  const endsAt = readTimestamp(body.endsAt, "Bitiş tarihi");
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new Error("Bitiş tarihi, başlangıç tarihinden önce olamaz.");
  }

  return {
    kind,
    title,
    discountType,
    percentOff,
    amountOffKurus,
    scopeAll,
    productIds,
    includeSaleItems: body.includeSaleItems === true,
    minSubtotalKurus,
    maxSubtotalKurus,
    minItems,
    maxItems,
    stackable: body.stackable === true,
    usageLimitTotal,
    usageLimitPerCustomer,
    startsAt,
    endsAt,
    active: body.active !== false,
  };
}

// -------------------------------------------------------------------- cart matching

export interface DiscountCartLine {
  productId: string;
  priceKurus: number;
  quantity: number;
  /** This product currently has a compare-at price above its price. */
  onSale: boolean;
}

export interface DiscountCartContext {
  lines: readonly DiscountCartLine[];
}

export function cartSubtotalKurus(cart: DiscountCartContext): number {
  return cart.lines.reduce((sum, line) => sum + line.priceKurus * line.quantity, 0);
}

export function cartItemCount(cart: DiscountCartContext): number {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** The part of the cart a campaign's Koşullar actually reach. */
export function qualifyingSubtotalKurus(
  campaign: Pick<TrDiscountCampaign, "scopeAll" | "productIds" | "includeSaleItems">,
  cart: DiscountCartContext,
): number {
  const scoped = new Set(campaign.productIds);
  return cart.lines.reduce((sum, line) => {
    const inScope = campaign.scopeAll || scoped.has(line.productId);
    const eligible = campaign.includeSaleItems || !line.onSale;
    return inScope && eligible ? sum + line.priceKurus * line.quantity : sum;
  }, 0);
}

/**
 * Whether a campaign can apply to this cart right now: active, within its date
 * window, under its own (automatic-only) usage cap, its Gereksinimler satisfied
 * against the whole cart, and its Koşullar reach at least one line. `now` defaults to
 * the real clock; pass a fixed value in tests.
 */
export function campaignMatchesCart(
  campaign: TrDiscountCampaign,
  cart: DiscountCartContext,
  now: Date = new Date(),
): boolean {
  if (!campaign.active) return false;
  if (campaign.startsAt && now < new Date(campaign.startsAt)) return false;
  if (campaign.endsAt && now > new Date(campaign.endsAt)) return false;
  if (
    campaign.kind === "automatic" &&
    campaign.usageLimitTotal !== null &&
    campaign.usedCount >= campaign.usageLimitTotal
  ) {
    return false;
  }

  const subtotal = cartSubtotalKurus(cart);
  const items = cartItemCount(cart);
  if (campaign.minSubtotalKurus !== null && subtotal < campaign.minSubtotalKurus) return false;
  if (campaign.maxSubtotalKurus !== null && subtotal > campaign.maxSubtotalKurus) return false;
  if (campaign.minItems !== null && items < campaign.minItems) return false;
  if (campaign.maxItems !== null && items > campaign.maxItems) return false;

  return qualifyingSubtotalKurus(campaign, cart) > 0;
}

/** What this campaign alone takes off, against only the cart lines it reaches. */
export function campaignDiscountKurus(
  campaign: Pick<TrDiscountCampaign, "discountType" | "percentOff" | "amountOffKurus" | "scopeAll" | "productIds" | "includeSaleItems">,
  cart: DiscountCartContext,
): number {
  const qualifying = qualifyingSubtotalKurus(campaign, cart);
  if (qualifying <= 0) return 0;
  if (campaign.discountType === "percent" && campaign.percentOff !== null) {
    return Math.floor((qualifying * campaign.percentOff) / 100);
  }
  if (campaign.discountType === "fixed" && campaign.amountOffKurus !== null) {
    return Math.min(qualifying, campaign.amountOffKurus);
  }
  return 0;
}

export interface ResolvedDiscount {
  /** The campaigns actually applied, largest-discount (or only) one first. */
  campaigns: TrDiscountCampaign[];
  discountKurus: number;
  freeShipping: boolean;
}

const EMPTY_RESOLVED: ResolvedDiscount = { campaigns: [], discountKurus: 0, freeShipping: false };

/**
 * Which of a boutique's automatic campaigns apply to this cart, and the combined
 * effect. Non-stackable matches are mutually exclusive — only the single one with
 * the largest discount applies (a tie keeps the earlier-created one); every matching
 * stackable campaign applies alongside it. Each campaign's discount is computed
 * against its own scope independently and the total is capped at the cart's
 * subtotal, so scoped campaigns never combine into more than 100% off.
 */
export function resolveAutomaticDiscount(
  campaigns: readonly TrDiscountCampaign[],
  cart: DiscountCartContext,
  now: Date = new Date(),
): ResolvedDiscount {
  const matching = campaigns
    .filter((campaign) => campaign.kind === "automatic")
    .filter((campaign) => campaignMatchesCart(campaign, cart, now));
  if (matching.length === 0) return EMPTY_RESOLVED;

  const stackable = matching.filter((campaign) => campaign.stackable);
  const exclusive = matching.filter((campaign) => !campaign.stackable);

  let best: TrDiscountCampaign | null = null;
  let bestKurus = -1;
  for (const campaign of exclusive) {
    const kurus = campaignDiscountKurus(campaign, cart);
    if (kurus > bestKurus) {
      best = campaign;
      bestKurus = kurus;
    }
  }

  const applied = best ? [best, ...stackable] : stackable;
  if (applied.length === 0) return EMPTY_RESOLVED;

  const subtotal = cartSubtotalKurus(cart);
  const discountKurus = Math.min(
    subtotal,
    applied.reduce((sum, campaign) => sum + campaignDiscountKurus(campaign, cart), 0),
  );
  const freeShipping = applied.some((campaign) => campaign.discountType === "free_shipping");

  // Largest discount first, for a stable, meaningful display order.
  const ordered = [...applied].sort(
    (a, b) => campaignDiscountKurus(b, cart) - campaignDiscountKurus(a, cart),
  );
  return { campaigns: ordered, discountKurus, freeShipping };
}

// ---------------------------------------------------------------------- code redemption

export type CodeRedemptionResult =
  | { ok: true; discountKurus: number; freeShipping: boolean }
  | { ok: false; error: string };

/**
 * Whether a typed code can be redeemed on this cart right now. `customerPriorUses` is
 * how many times this customer has already used this exact code — counted from past
 * orders by the caller (`catalog/discountCampaigns.ts`), not tracked on the code row.
 */
export function evaluateCodeRedemption(input: {
  campaign: TrDiscountCampaign;
  code: TrDiscountCampaignCode;
  cart: DiscountCartContext;
  customerPriorUses: number;
  now?: Date;
}): CodeRedemptionResult {
  const { campaign, code, cart, customerPriorUses, now = new Date() } = input;
  if (campaign.kind !== "code" || !campaignMatchesCart(campaign, cart, now)) {
    return { ok: false, error: "Kupon kodu geçersiz." };
  }
  if (code.usageLimitTotal !== null && code.usedCount >= code.usageLimitTotal) {
    return { ok: false, error: "Kupon kullanım limiti doldu." };
  }
  if (code.usageLimitPerCustomer !== null && customerPriorUses >= code.usageLimitPerCustomer) {
    return { ok: false, error: "Bu kuponu daha önce kullandınız." };
  }
  return {
    ok: true,
    discountKurus: campaignDiscountKurus(campaign, cart),
    freeShipping: campaign.discountType === "free_shipping",
  };
}
