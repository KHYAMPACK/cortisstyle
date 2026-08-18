import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { decrementInventoryForOrderLines } from "@/lib/tr/inventory";
import { verifyOrderConfirmToken } from "@/lib/tr/orderConfirmToken";
import {
  getOrderByIdAdmin,
  updateOrderPaymentStatusAdmin,
} from "@/lib/tr/orders";
import { IyzicoError } from "@/lib/tr/payments/iyzicoClient";
import { abandonUnpaidIyzicoOrder } from "@/lib/tr/payments/abandonUnpaid";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import { startIyzicoCheckoutForm } from "@/lib/tr/payments/startCheckoutForm";
import {
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";
import { CHECKOUT_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";

export const runtime = "nodejs";

type StartBody = {
  boutiqueSlug?: string;
  orderId?: string;
  confirmToken?: string;
};

/**
 * Resume iyzico Checkout Form for a pending boutique order.
 * POST /api/tr/checkout/iyzico/start
 */
export async function POST(request: Request) {
  let body: StartBody;
  try {
    body = (await request.json()) as StartBody;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const ip = clientIpFromRequest(request);
  const limited = consumeRateLimit({
    key: `iyzico-start:${ip}`,
    ...CHECKOUT_RATE_LIMITS.iyzicoStartPerIp,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const boutiqueSlug = body.boutiqueSlug?.trim().toLowerCase() ?? "";
  const orderId = body.orderId?.trim() ?? "";
  if (!boutiqueSlug || !orderId) {
    return Response.json({ error: "Eksik sipariş bilgisi." }, { status: 400 });
  }
  if (!boutiqueOffersIyzicoCheckout(boutiqueSlug)) {
    return Response.json(
      { error: "Bu butikte kart ödemesi yok." },
      { status: 404 },
    );
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

  if (order.isSandbox) {
    return Response.json(
      { error: "Sandbox siparişte kart çekimi yok." },
      { status: 400 },
    );
  }

  if (order.paymentStatus === "paid") {
    return Response.json({ ok: true, alreadyPaid: true });
  }

  if (order.paymentStatus !== "pending" && order.paymentStatus !== "failed") {
    return Response.json(
      { error: "Bu sipariş için ödeme başlatılamaz." },
      { status: 409 },
    );
  }

  let payable = order;
  if (order.paymentStatus === "failed") {
    try {
      await decrementInventoryForOrderLines(
        order.items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId as string,
            size: item.size,
            quantity: item.quantity,
          })),
      );
    } catch (stockError) {
      return Response.json(
        {
          error:
            stockError instanceof Error
              ? stockError.message
              : "Stok kalmadı. Sepeti yenileyin.",
        },
        { status: 409 },
      );
    }
    await updateOrderPaymentStatusAdmin(order.id, "pending");
    const reloaded = await getOrderByIdAdmin(order.id);
    if (!reloaded) {
      return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }
    payable = reloaded;
  }

  try {
    const started = await startIyzicoCheckoutForm({
      boutiqueSlug,
      boutiqueCustomDomain: boutique.customDomain,
      order: payable,
      buyerIp: ip,
    });
    return Response.json({
      ok: true,
      paymentPageUrl: started.paymentPageUrl,
    });
  } catch (error) {
    console.error("[tr/checkout/iyzico/start] failed:", error);
    try {
      await abandonUnpaidIyzicoOrder(payable);
    } catch (abandonError) {
      console.error("[tr/checkout/iyzico/start] abandon:", abandonError);
    }
    const message =
      error instanceof IyzicoError
        ? error.message
        : "Ödeme sayfası açılamadı.";
    const status = error instanceof IyzicoError ? error.status : 502;
    return Response.json({ error: message }, { status });
  }
}
