import { createOrderAdmin } from "@/lib/tr/orders";
import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import {
  recordDiscountUsageIfNeeded,
  resolveCheckoutFromCatalog,
  type CheckoutClientItem,
} from "@/lib/tr/checkoutValidate";
import { createOrderConfirmToken } from "@/lib/tr/orderConfirmToken";
import { isTrCheckoutSandboxMode } from "@/lib/tr/checkoutMode";
import {
  normalizeBuyerTaxId,
  validateCheckoutInvoiceFields,
} from "@/lib/tr/invoiceFields";
import { validateTurkeyShippingAddress } from "@/lib/tr/geo/turkeyAddress";
import {
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";
import { CHECKOUT_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";
import { isValidNotifyEmail } from "@/lib/supabaseAdmin";
import {
  boutiqueOffersIyzicoCheckout,
  getIyzicoCredentials,
} from "@/lib/tr/payments/registry";
import { abandonUnpaidIyzicoOrder } from "@/lib/tr/payments/abandonUnpaid";
import { startIyzicoCheckoutForm } from "@/lib/tr/payments/startCheckoutForm";
import { autoFulfillPaidShipment } from "@/lib/tr/shipping/ownerShipment";
import { quoteCheckoutShippingFee } from "@/lib/tr/shipping/quoteShipping";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import type {
  CreateTrOrderInput,
  TrBoutiquePublic,
  TrInvoiceType,
} from "@/types/tr-marketplace";

export const runtime = "nodejs";

type CheckoutBody = {
  boutiqueSlug?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: CreateTrOrderInput["shippingAddress"];
  invoiceType?: TrInvoiceType | string;
  buyerTaxId?: string;
  buyerTaxOffice?: string;
  buyerTitle?: string;
  items: CheckoutClientItem[];
  discountCode?: string;
  /** Accept mesafeli satış + ön bilgilendirme */
  acceptedDistanceSales: boolean;
  acceptedKvkk: boolean;
};

function validateCustomerFields(body: CheckoutBody): string | null {
  if (!body.customerName?.trim() || body.customerName.trim().length < 2) {
    return "Geçerli bir ad soyad girin.";
  }
  const email = body.customerEmail?.trim().toLowerCase() ?? "";
  if (!isValidNotifyEmail(email)) {
    return "Geçerli bir e-posta girin.";
  }
  const phone = body.customerPhone?.trim() ?? "";
  if (phone.length < 10) {
    return "Geçerli bir telefon numarası girin.";
  }
  const addr = body.shippingAddress;
  if (!addr) {
    return "Teslimat adresini tamamlayın.";
  }
  const validated = validateTurkeyShippingAddress(addr);
  if (!validated.ok) return validated.error;
  body.shippingAddress = {
    line1: validated.address.line1,
    line2: validated.address.line2,
    city: validated.address.city,
    district: validated.address.district,
    postalCode: validated.address.postalCode,
    country: "TR",
  };
  return null;
}

/**
 * Boutique checkout — sandbox only when TR_CHECKOUT_SANDBOX=true;
 * otherwise creates pending orders (ready for iyzico capture).
 * POST /api/tr/checkout
 */
export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const ip = clientIpFromRequest(request);
  const ipLimit = consumeRateLimit({
    key: `checkout:ip:${ip}`,
    ...CHECKOUT_RATE_LIMITS.perIp,
  });
  if (!ipLimit.ok) return rateLimitResponse(ipLimit.retryAfterSec);

  if (!body.acceptedDistanceSales || !body.acceptedKvkk) {
    return Response.json(
      { error: "Sözleşmeleri onaylamanız gerekir." },
      { status: 400 },
    );
  }

  const fieldError = validateCustomerFields(body);
  if (fieldError) {
    return Response.json({ error: fieldError }, { status: 400 });
  }

  const invoiceError = validateCheckoutInvoiceFields({
    invoiceType: body.invoiceType,
    buyerTaxId: body.buyerTaxId,
    buyerTaxOffice: body.buyerTaxOffice,
    buyerTitle: body.buyerTitle,
  });
  if (invoiceError) {
    return Response.json({ error: invoiceError }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Sepet boş." }, { status: 400 });
  }

  const boutiqueSlug = body.boutiqueSlug?.trim().toLowerCase() || null;
  let expectedBoutiqueId: string | null = null;
  let boutique: TrBoutiquePublic | null = null;

  if (boutiqueSlug) {
    const boutiqueLimit = consumeRateLimit({
      key: `checkout:boutique:${boutiqueSlug}`,
      ...CHECKOUT_RATE_LIMITS.perBoutique,
    });
    if (!boutiqueLimit.ok) return rateLimitResponse(boutiqueLimit.retryAfterSec);

    boutique = await getPublicBoutiqueBySlug(boutiqueSlug);
    if (!boutique) {
      return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
    }
    expectedBoutiqueId = boutique.id;
  }

  try {
    const resolved = await resolveCheckoutFromCatalog({
      items: body.items,
      expectedBoutiqueId,
      discountCode: body.discountCode,
    });

    if (!resolved.ok) {
      return Response.json(
        { error: resolved.error },
        { status: resolved.status },
      );
    }

    const { checkout } = resolved;

    const sandbox = isTrCheckoutSandboxMode();
    const wantsIyzico =
      Boolean(boutiqueSlug) &&
      !sandbox &&
      boutiqueOffersIyzicoCheckout(boutiqueSlug);
    if (wantsIyzico && !getIyzicoCredentials(boutiqueSlug!)) {
      return Response.json(
        { error: "Kart ödemesi şu an alınamıyor. Biraz sonra tekrar deneyin." },
        { status: 503 },
      );
    }

    const invoiceType: TrInvoiceType =
      body.invoiceType === "corporate" ? "corporate" : "individual";

    let shippingFeeKurus = 0;
    let shippingProvider: CreateTrOrderInput["shippingProvider"] = null;
    if (boutiqueSlug && boutiqueHasLiveShipping(boutiqueSlug)) {
      const itemCount = checkout.lines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      );
      const quote = quoteCheckoutShippingFee(boutiqueSlug, itemCount);
      if (!quote) {
        return Response.json(
          { error: "Kargo ücreti alınamadı. Adresi kontrol edip tekrar deneyin." },
          { status: 502 },
        );
      }
      shippingFeeKurus = quote.feeKurus;
      shippingProvider = "basitkargo";
    }

    const order = await createOrderAdmin({
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      invoiceType,
      buyerTaxId:
        invoiceType === "corporate"
          ? normalizeBuyerTaxId(body.buyerTaxId)
          : null,
      buyerTaxOffice:
        invoiceType === "corporate" ? body.buyerTaxOffice : undefined,
      buyerTitle: invoiceType === "corporate" ? body.buyerTitle : undefined,
      items: checkout.lines.map((line) => ({
        productId: line.productId,
        boutiqueId: line.boutiqueId,
        title: line.title,
        priceKurus: line.priceKurus,
        quantity: line.quantity,
        size: line.size,
      })),
      discountCode: checkout.discountCode,
      discountKurus: checkout.discountKurus,
      shippingFeeKurus,
      shippingProvider,
      isSandbox: sandbox,
      decrementInventory: true,
      notifyOwners: !wantsIyzico,
    });

    // Card capture: burn the coupon only after iyzico SUCCESS.
    if (!wantsIyzico) {
      try {
        await recordDiscountUsageIfNeeded(checkout.discountRow);
      } catch (couponError) {
        console.error("[tr/checkout] coupon usage increment failed:", couponError);
      }
    }

    const confirmToken = createOrderConfirmToken(order.id);

    if (
      sandbox &&
      boutiqueSlug &&
      expectedBoutiqueId &&
      boutiqueHasLiveShipping(boutiqueSlug)
    ) {
      await autoFulfillPaidShipment(
        { id: expectedBoutiqueId, slug: boutiqueSlug },
        order.id,
      );
    }

    let paymentPageUrl: string | null = null;
    if (wantsIyzico && boutique) {
      try {
        const started = await startIyzicoCheckoutForm({
          boutiqueSlug: boutique.slug,
          boutiqueCustomDomain: boutique.customDomain,
          order,
          buyerIp: ip,
        });
        paymentPageUrl = started.paymentPageUrl;
      } catch (iyzicoError) {
        console.error("[tr/checkout] iyzico initialize failed:", iyzicoError);
        try {
          await abandonUnpaidIyzicoOrder(order);
        } catch (abandonError) {
          console.error("[tr/checkout] abandon after init fail:", abandonError);
        }
      }
    }

    return Response.json({
      ok: true,
      orderId: order.id,
      confirmToken,
      sandbox,
      totalKurus: order.totalKurus,
      discountKurus: order.discountKurus,
      paymentPageUrl,
    });
  } catch (error) {
    console.error("TR checkout failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Sipariş oluşturulamadı.",
      },
      { status: 500 },
    );
  }
}
