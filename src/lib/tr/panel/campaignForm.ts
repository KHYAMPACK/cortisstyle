import { kurusToPriceInput, parseTryPrice } from "@/lib/tr/ownerProductConstraints";
import { readCampaignBody } from "@/lib/tr/discounts/campaignRules";
import type {
  TrDiscountCampaign,
  TrDiscountKind,
  TrDiscountType,
} from "@/lib/tr/discounts/types";

/**
 * Form state of the discount campaign editor, kept as the strings the owner typed.
 * Money and dates are typed values (`amountOffTry`, `startsAt` as a datetime-local
 * string); `campaignInput` turns them into the API body's kuruş/ISO shape, which is
 * also what `readCampaignBody` (the source of truth for validation) expects.
 */
export interface CampaignFormState {
  kind: TrDiscountKind;
  title: string;
  discountType: TrDiscountType;
  percentOff: string;
  amountOffTry: string;
  scopeAll: boolean;
  productIds: string[];
  includeSaleItems: boolean;
  minSubtotalTry: string;
  maxSubtotalTry: string;
  minItems: string;
  maxItems: string;
  stackable: boolean;
  usageLimitTotal: string;
  usageLimitPerCustomer: string;
  /** `<input type="datetime-local">` value in local time; "" = not set. */
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export function emptyCampaignForm(kind: TrDiscountKind = "automatic"): CampaignFormState {
  return {
    kind,
    title: "",
    discountType: "percent",
    percentOff: "",
    amountOffTry: "",
    scopeAll: true,
    productIds: [],
    includeSaleItems: false,
    minSubtotalTry: "",
    maxSubtotalTry: "",
    minItems: "",
    maxItems: "",
    stackable: false,
    usageLimitTotal: "",
    usageLimitPerCustomer: "",
    startsAt: "",
    endsAt: "",
    active: true,
  };
}

function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function campaignFormFromCampaign(campaign: TrDiscountCampaign): CampaignFormState {
  return {
    kind: campaign.kind,
    title: campaign.title,
    discountType: campaign.discountType,
    percentOff: campaign.percentOff !== null ? String(campaign.percentOff) : "",
    amountOffTry:
      campaign.amountOffKurus !== null ? kurusToPriceInput(campaign.amountOffKurus) : "",
    scopeAll: campaign.scopeAll,
    productIds: [...campaign.productIds],
    includeSaleItems: campaign.includeSaleItems,
    minSubtotalTry:
      campaign.minSubtotalKurus !== null ? kurusToPriceInput(campaign.minSubtotalKurus) : "",
    maxSubtotalTry:
      campaign.maxSubtotalKurus !== null ? kurusToPriceInput(campaign.maxSubtotalKurus) : "",
    minItems: campaign.minItems !== null ? String(campaign.minItems) : "",
    maxItems: campaign.maxItems !== null ? String(campaign.maxItems) : "",
    stackable: campaign.stackable,
    usageLimitTotal:
      campaign.usageLimitTotal !== null ? String(campaign.usageLimitTotal) : "",
    usageLimitPerCustomer:
      campaign.usageLimitPerCustomer !== null ? String(campaign.usageLimitPerCustomer) : "",
    startsAt: campaign.startsAt ? isoToDatetimeLocal(campaign.startsAt) : "",
    endsAt: campaign.endsAt ? isoToDatetimeLocal(campaign.endsAt) : "",
    active: campaign.active,
  };
}

function kurusFromTryInput(raw: string): number | null {
  if (!raw.trim()) return null;
  const lira = parseTryPrice(raw);
  return lira === null ? null : Math.round(lira * 100);
}

function intFromInput(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/** The API body — also what `validateCampaignForm` feeds to `readCampaignBody`. */
export function campaignInput(form: CampaignFormState): Record<string, unknown> {
  return {
    kind: form.kind,
    title: form.title.trim(),
    discountType: form.discountType,
    percentOff: form.discountType === "percent" ? intFromInput(form.percentOff) : null,
    amountOffKurus: form.discountType === "fixed" ? kurusFromTryInput(form.amountOffTry) : null,
    scopeAll: form.scopeAll,
    productIds: form.scopeAll ? [] : form.productIds,
    includeSaleItems: form.includeSaleItems,
    minSubtotalKurus: kurusFromTryInput(form.minSubtotalTry),
    maxSubtotalKurus: kurusFromTryInput(form.maxSubtotalTry),
    minItems: intFromInput(form.minItems),
    maxItems: intFromInput(form.maxItems),
    stackable: form.stackable,
    usageLimitTotal: intFromInput(form.usageLimitTotal),
    usageLimitPerCustomer: intFromInput(form.usageLimitPerCustomer),
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    active: form.active,
  };
}

/** First problem in the form as a sentence, or null when it can be saved. Uses the API's own rules. */
export function validateCampaignForm(form: CampaignFormState): string | null {
  try {
    readCampaignBody(campaignInput(form));
    return null;
  } catch (problem) {
    return problem instanceof Error ? problem.message : "Kampanya geçersiz.";
  }
}
