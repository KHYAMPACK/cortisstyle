/**
 * Discount campaigns (İndirimler): an 'automatic' campaign applies itself when a cart
 * matches it; a 'code' campaign only applies through one of its own codes (Kuponlar).
 * Client-safe (no server imports) — see `campaignRules.ts` for the cart-matching and
 * validation logic, and `catalog/discountCampaigns.ts` for the database side.
 */

export type TrDiscountKind = "automatic" | "code";
export type TrDiscountType = "percent" | "fixed" | "free_shipping";

/** The Koşullar + Gereksinimler + Ayarlar + Kullanım Limitleri + Aktif Tarihler fields. */
export interface TrDiscountCampaign {
  id: string;
  boutiqueId: string;
  kind: TrDiscountKind;
  title: string;
  discountType: TrDiscountType;
  /** Set only when discountType = 'percent'. */
  percentOff: number | null;
  /** Set only when discountType = 'fixed'. */
  amountOffKurus: number | null;
  /** Koşullar: every product, or just `productIds`. */
  scopeAll: boolean;
  /** Empty when scopeAll (nothing to scope to). */
  productIds: string[];
  /** "İndirimli ürünleri kampanyaya dahil et" — a product already on sale still qualifies. */
  includeSaleItems: boolean;
  minSubtotalKurus: number | null;
  maxSubtotalKurus: number | null;
  minItems: number | null;
  maxItems: number | null;
  /** "Diğer kampanyalarla birleştirilsin." */
  stackable: boolean;
  /** Meaningful for `kind: 'automatic'` only; a code campaign limits its codes instead. */
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One redeemable code of a `kind: 'code'` campaign (the Kuponlar tab). */
export interface TrDiscountCampaignCode {
  id: string;
  campaignId: string;
  boutiqueId: string;
  code: string;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  usedCount: number;
  createdAt: string;
}

export function readDiscountKind(value: unknown): TrDiscountKind | null {
  return value === "automatic" || value === "code" ? value : null;
}

export function readDiscountType(value: unknown): TrDiscountType | null {
  return value === "percent" || value === "fixed" || value === "free_shipping"
    ? value
    : null;
}

function readNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function readNullableTimestamp(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export function mapDiscountCampaignRow(
  row: Record<string, unknown>,
  productIds: readonly string[] = [],
): TrDiscountCampaign {
  return {
    id: String(row.id),
    boutiqueId: String(row.boutique_id),
    kind: readDiscountKind(row.kind) ?? "automatic",
    title: String(row.title ?? ""),
    discountType: readDiscountType(row.discount_type) ?? "percent",
    percentOff: readNullableNumber(row.percent_off),
    amountOffKurus: readNullableNumber(row.amount_off_kurus),
    scopeAll: row.scope_all !== false,
    productIds: [...productIds],
    includeSaleItems: row.include_sale_items === true,
    minSubtotalKurus: readNullableNumber(row.min_subtotal_kurus),
    maxSubtotalKurus: readNullableNumber(row.max_subtotal_kurus),
    minItems: readNullableNumber(row.min_items),
    maxItems: readNullableNumber(row.max_items),
    stackable: row.stackable === true,
    usageLimitTotal: readNullableNumber(row.usage_limit_total),
    usageLimitPerCustomer: readNullableNumber(row.usage_limit_per_customer),
    usedCount: typeof row.used_count === "number" ? row.used_count : 0,
    startsAt: readNullableTimestamp(row.starts_at),
    endsAt: readNullableTimestamp(row.ends_at),
    active: row.active !== false,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapDiscountCampaignCodeRow(
  row: Record<string, unknown>,
): TrDiscountCampaignCode {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    boutiqueId: String(row.boutique_id),
    code: String(row.code ?? ""),
    usageLimitTotal: readNullableNumber(row.usage_limit_total),
    usageLimitPerCustomer: readNullableNumber(row.usage_limit_per_customer),
    usedCount: typeof row.used_count === "number" ? row.used_count : 0,
    createdAt: String(row.created_at ?? ""),
  };
}
