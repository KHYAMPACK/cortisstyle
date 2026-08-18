import { preferredBoutiqueOrigin } from "@/lib/tr/seo/storefrontSeo";
import { trOrderConfirmationPath } from "@/lib/tr/paths";
import {
  formatIyzicoGsm,
  formatIyzicoPrice,
  ipv4ForIyzico,
  IYZICO_IDENTITY_FALLBACK,
  splitBuyerName,
  truncateIyzicoText,
} from "@/lib/tr/payments/iyzicoFormat";
import {
  IyzicoError,
  iyzicoInitializeCheckoutForm,
} from "@/lib/tr/payments/iyzicoClient";
import { getIyzicoCredentials } from "@/lib/tr/payments/registry";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

function callbackOrigin(boutique: {
  slug: string;
  customDomain?: string | null;
}): string {
  const override = process.env.TR_IYZICO_CALLBACK_ORIGIN?.trim().replace(
    /\/$/,
    "",
  );
  if (override) return override;

  const custom = boutique.customDomain
    ?.trim()
    .toLowerCase()
    .replace(/^www\./, "");
  if (custom?.includes(".")) return `https://${custom}`;

  const mapped = preferredBoutiqueOrigin(boutique.slug)?.replace(
    "://www.",
    "://",
  );
  if (mapped) return mapped;

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) return site;

  throw new IyzicoError("iyzico dönüş adresi yapılandırılmadı.", 500);
}

export function iyzicoCallbackUrl(boutique: {
  slug: string;
  customDomain?: string | null;
}): string {
  const origin = callbackOrigin(boutique);
  const slug = encodeURIComponent(boutique.slug.trim().toLowerCase());
  return `${origin}/api/tr/checkout/iyzico/callback?boutique=${slug}`;
}

export function iyzicoConfirmUrl(input: {
  boutiqueSlug: string;
  customDomain?: string | null;
  orderId: string;
  confirmToken: string;
  unpaid?: boolean;
}): string {
  const origin = callbackOrigin({
    slug: input.boutiqueSlug,
    customDomain: input.customDomain,
  });
  const path = trOrderConfirmationPath({ boutique: input.boutiqueSlug });
  const params = new URLSearchParams({
    order: input.orderId,
    token: input.confirmToken,
  });
  if (input.unpaid) params.set("unpaid", "1");
  return `${origin}${path}?${params.toString()}`;
}

function shippingStreet(order: TrOrderWithItems): string {
  const { line1, line2, district } = order.shippingAddress;
  return [line1, line2, district].filter(Boolean).join(" ").trim();
}

function allocatedLineKurus(order: TrOrderWithItems): number[] {
  const lines = order.items.map(
    (item) => item.priceKurus * Math.max(1, item.quantity),
  );
  const subtotal = lines.reduce((sum, value) => sum + value, 0);
  let remainingDiscount = Math.max(0, order.discountKurus);
  return lines.map((lineTotal, index) => {
    if (index === lines.length - 1) {
      return Math.max(0, lineTotal - remainingDiscount);
    }
    const share =
      subtotal === 0 ? 0 : Math.floor((lineTotal / subtotal) * order.discountKurus);
    remainingDiscount -= share;
    return Math.max(0, lineTotal - share);
  });
}

export async function startIyzicoCheckoutForm(input: {
  boutiqueSlug: string;
  boutiqueCustomDomain?: string | null;
  order: TrOrderWithItems;
  buyerIp: string;
}): Promise<{ paymentPageUrl: string; token: string }> {
  const creds = getIyzicoCredentials(input.boutiqueSlug);
  if (!creds) {
    throw new IyzicoError("Bu butik için iyzico anahtarı yok.", 503);
  }

  const callbackUrl = iyzicoCallbackUrl({
    slug: input.boutiqueSlug,
    customDomain: input.boutiqueCustomDomain,
  });
  if (!callbackUrl.startsWith("https://")) {
    throw new IyzicoError(
      "Kart ödemesi HTTPS adresi ister. Canlı Lila domaininde deneyin.",
      503,
    );
  }

  const { name, surname } = splitBuyerName(input.order.customerName);
  const street = shippingStreet(input.order) || input.order.shippingAddress.city;
  const allocated = allocatedLineKurus(input.order);
  const shippingFee = Math.max(0, input.order.shipment.feeKurus ?? 0);

  const basketKurus: Array<{
    id: string;
    kurus: number;
    name: string;
    category1: string;
  }> = input.order.items.map((item, index) => ({
    id: truncateIyzicoText(item.id || `item-${index + 1}`, 32),
    kurus: allocated[index] ?? 0,
    name: truncateIyzicoText(item.title || "Ürün", 50),
    category1: "Giyim",
  }));

  if (shippingFee > 0) {
    basketKurus.push({
      id: "shipping",
      kurus: shippingFee,
      name: "Kargo",
      category1: "Kargo",
    });
  }

  const basketSum = basketKurus.reduce((sum, item) => sum + item.kurus, 0);
  const drift = input.order.totalKurus - basketSum;
  if (drift !== 0 && basketKurus.length > 0) {
    const last = basketKurus[basketKurus.length - 1]!;
    last.kurus = Math.max(0, last.kurus + drift);
  }

  const basketItems = basketKurus.map((item) => ({
    id: item.id,
    price: formatIyzicoPrice(item.kurus),
    name: item.name,
    category1: item.category1,
    itemType: "PHYSICAL",
  }));

  const address = {
    contactName: truncateIyzicoText(input.order.customerName, 50),
    city: input.order.shippingAddress.city,
    country: "Turkey",
    address: truncateIyzicoText(street, 200),
    zipCode: input.order.shippingAddress.postalCode || "00000",
  };

  const result = await iyzicoInitializeCheckoutForm(creds, {
    locale: "tr",
    conversationId: input.order.id,
    price: formatIyzicoPrice(input.order.totalKurus),
    paidPrice: formatIyzicoPrice(input.order.totalKurus),
    currency: "TRY",
    basketId: input.order.id,
    paymentGroup: "PRODUCT",
    callbackUrl,
    enabledInstallments: [1],
    forceThreeDS: 1,
    buyer: {
      id: truncateIyzicoText(input.order.id.replace(/-/g, ""), 32),
      name,
      surname,
      identityNumber: IYZICO_IDENTITY_FALLBACK,
      email: input.order.customerEmail,
      gsmNumber: formatIyzicoGsm(input.order.customerPhone),
      registrationAddress: truncateIyzicoText(street, 200),
      city: input.order.shippingAddress.city,
      country: "Turkey",
      zipCode: input.order.shippingAddress.postalCode || "00000",
      ip: ipv4ForIyzico(input.buyerIp),
    },
    shippingAddress: address,
    billingAddress: address,
    basketItems,
  });

  if (result.status !== "success" || !result.paymentPageUrl || !result.token) {
    throw new IyzicoError(
      result.errorMessage || "iyzico ödeme sayfası açılamadı.",
    );
  }

  return { paymentPageUrl: result.paymentPageUrl, token: result.token };
}
