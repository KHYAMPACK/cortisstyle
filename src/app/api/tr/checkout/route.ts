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
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";
import { CHECKOUT_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";
import { isValidNotifyEmail } from "@/lib/supabaseAdmin";
import type { CreateTrOrderInput } from "@/types/tr-marketplace";

export const runtime = "nodejs";

type CheckoutBody = {
  boutiqueSlug?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: CreateTrOrderInput["shippingAddress"];
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
  if (
    !addr?.line1?.trim() ||
    !addr.district?.trim() ||
    !addr.city?.trim() ||
    !addr.postalCode?.trim()
  ) {
    return "Teslimat adresini tamamlayın.";
  }
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

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Sepet boş." }, { status: 400 });
  }

  const boutiqueSlug = body.boutiqueSlug?.trim().toLowerCase() || null;
  let expectedBoutiqueId: string | null = null;

  if (boutiqueSlug) {
    const boutiqueLimit = consumeRateLimit({
      key: `checkout:boutique:${boutiqueSlug}`,
      ...CHECKOUT_RATE_LIMITS.perBoutique,
    });
    if (!boutiqueLimit.ok) return rateLimitResponse(boutiqueLimit.retryAfterSec);

    const boutique = await getPublicBoutiqueBySlug(boutiqueSlug);
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

    const order = await createOrderAdmin({
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
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
      isSandbox: sandbox,
      decrementInventory: true,
    });

    // Increment after order create so a failed order does not burn the coupon.
    // Usage limit was already checked in resolveCheckoutFromCatalog.
    try {
      await recordDiscountUsageIfNeeded(checkout.discountRow);
    } catch (couponError) {
      console.error("[tr/checkout] coupon usage increment failed:", couponError);
    }

    const confirmToken = createOrderConfirmToken(order.id);

    return Response.json({
      ok: true,
      orderId: order.id,
      confirmToken,
      sandbox,
      totalKurus: order.totalKurus,
      discountKurus: order.discountKurus,
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
