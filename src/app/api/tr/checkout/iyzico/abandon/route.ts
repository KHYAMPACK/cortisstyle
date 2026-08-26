import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { verifyOrderConfirmToken } from "@/lib/tr/orderConfirmToken";
import { getOrderByIdAdmin } from "@/lib/tr/orders";
import { abandonUnpaidIyzicoOrder } from "@/lib/tr/payments/abandonUnpaid";
import { captureBoutiqueOrderAsPaid } from "@/lib/tr/payments/capturePaidOrder";
import { iyzicoRetrieveCheckoutForm } from "@/lib/tr/payments/iyzicoClient";
import { iyzicoPaymentMatchesOrder } from "@/lib/tr/payments/iyzicoFormat";
import {
  boutiqueOffersIyzicoCheckout,
  getIyzicoCredentials,
} from "@/lib/tr/payments/registry";
import {
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";
import { CHECKOUT_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";
import type { TrBoutiquePublic, TrOrderWithItems } from "@/types/tr-marketplace";

export const runtime = "nodejs";

type Body = {
  boutiqueSlug?: string;
  orderId?: string;
  confirmToken?: string;
  checkoutToken?: string;
};

async function captureIfAlreadyPaid(input: {
  boutique: Pick<TrBoutiquePublic, "id" | "slug">;
  order: TrOrderWithItems;
  checkoutToken?: string;
}): Promise<boolean> {
  const token = input.checkoutToken?.trim();
  const creds = getIyzicoCredentials(input.boutique.slug);
  if (!token || !creds) return false;
  try {
    const retrieve = await iyzicoRetrieveCheckoutForm(creds, {
      token,
      conversationId: input.order.id,
    });
    const paymentId = String(retrieve.paymentId ?? "").trim();
    if (retrieve.status !== "success" || !paymentId) return false;
    if (iyzicoPaymentMatchesOrder(input.order, retrieve)) return false;
    await captureBoutiqueOrderAsPaid({
      boutique: { id: input.boutique.id, slug: input.boutique.slug },
      orderId: input.order.id,
      iyzico: { paymentId, conversationId: input.order.id },
    });
    return true;
  } catch (error) {
    console.error("[tr/checkout/iyzico/abandon] retrieve/capture:", error);
    return false;
  }
}

/**
 * Shopper left iyzico without paying (browser back). Release the stock hold.
 * POST /api/tr/checkout/iyzico/abandon
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const ip = clientIpFromRequest(request);
  const limited = consumeRateLimit({
    key: `iyzico-abandon:${ip}`,
    ...CHECKOUT_RATE_LIMITS.iyzicoAbandonPerIp,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const boutiqueSlug = body.boutiqueSlug?.trim().toLowerCase() ?? "";
  const orderId = body.orderId?.trim() ?? "";
  if (!boutiqueSlug || !orderId) {
    return Response.json({ error: "Eksik sipariş bilgisi." }, { status: 400 });
  }
  if (!boutiqueOffersIyzicoCheckout(boutiqueSlug)) {
    return Response.json({ error: "Bu butikte kart ödemesi yok." }, { status: 404 });
  }
  if (!verifyOrderConfirmToken(orderId, body.confirmToken ?? null)) {
    return Response.json({ error: "Geçersiz bağlantı." }, { status: 403 });
  }

  const boutique = await getPublicBoutiqueBySlug(boutiqueSlug);
  if (!boutique) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  const order = await getOrderByIdAdmin(orderId);
  const belongs = Boolean(
    order?.items.some((item) => item.boutiqueId === boutique.id),
  );
  if (!order || !belongs) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  try {
    if (order.paymentStatus === "paid") {
      return Response.json({ ok: true, paymentStatus: "paid" });
    }

    const captured = await captureIfAlreadyPaid({
      boutique,
      order,
      checkoutToken: body.checkoutToken,
    });
    if (captured) {
      return Response.json({ ok: true, paymentStatus: "paid" });
    }

    await abandonUnpaidIyzicoOrder(order);
  } catch (error) {
    console.error("[tr/checkout/iyzico/abandon] failed:", error);
    return Response.json({ error: "Stok iadesi yapılamadı." }, { status: 500 });
  }

  const latest = await getOrderByIdAdmin(orderId);
  return Response.json({
    ok: true,
    paymentStatus: latest?.paymentStatus ?? "failed",
  });
}
