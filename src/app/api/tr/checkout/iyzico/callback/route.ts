import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { createOrderConfirmToken } from "@/lib/tr/orderConfirmToken";
import { getOrderByIdAdmin } from "@/lib/tr/orders";
import { abandonUnpaidIyzicoOrder } from "@/lib/tr/payments/abandonUnpaid";
import { captureBoutiqueOrderAsPaid } from "@/lib/tr/payments/capturePaidOrder";
import { IyzicoError, iyzicoRetrieveCheckoutForm } from "@/lib/tr/payments/iyzicoClient";
import { iyzicoPaymentMatchesOrder } from "@/lib/tr/payments/iyzicoFormat";
import { getIyzicoCredentials } from "@/lib/tr/payments/registry";
import { iyzicoConfirmUrl } from "@/lib/tr/payments/startCheckoutForm";
import {
  clientIpFromRequest,
  consumeRateLimit,
} from "@/lib/tr/rateLimit";
import { CHECKOUT_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";

export const runtime = "nodejs";

function redirectTo(url: string, status = 303): Response {
  return Response.redirect(url, status);
}

async function tokenFromRequest(request: Request): Promise<string> {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("token")?.trim() ?? "";
  if (fromQuery) return fromQuery;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { token?: string };
      return body.token?.trim() ?? "";
    } catch {
      return "";
    }
  }

  try {
    const form = await request.formData();
    return String(form.get("token") ?? "").trim();
  } catch {
    return "";
  }
}

async function handleCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const boutiqueSlug = url.searchParams.get("boutique")?.trim().toLowerCase() ?? "";
  const ip = clientIpFromRequest(request);
  const limited = consumeRateLimit({
    key: `iyzico-callback:${ip}`,
    ...CHECKOUT_RATE_LIMITS.iyzicoCallbackPerIp,
  });
  if (!limited.ok) {
    return new Response("Çok fazla istek.", { status: 429 });
  }

  if (!boutiqueSlug) {
    return new Response("Butik eksik.", { status: 400 });
  }

  const boutique = await getPublicBoutiqueBySlug(boutiqueSlug);
  const creds = getIyzicoCredentials(boutiqueSlug);
  if (!boutique || !creds) {
    return new Response("Ödeme yapılandırması yok.", { status: 404 });
  }

  const token = await tokenFromRequest(request);
  if (!token) {
    return new Response("Ödeme jetonu eksik.", { status: 400 });
  }

  let retrieve;
  try {
    retrieve = await iyzicoRetrieveCheckoutForm(creds, { token });
  } catch (error) {
    console.error("[tr/checkout/iyzico/callback] retrieve failed:", error);
    return new Response(
      error instanceof IyzicoError ? error.message : "Ödeme doğrulanamadı.",
      { status: 502 },
    );
  }

  const orderId =
    typeof retrieve.conversationId === "string"
      ? retrieve.conversationId.trim()
      : "";
  if (!orderId) {
    return new Response("Sipariş eşleşmedi.", { status: 400 });
  }

  const order = await getOrderByIdAdmin(orderId);
  const belongs = Boolean(
    order?.items.some((item) => item.boutiqueId === boutique.id),
  );
  const confirmToken = createOrderConfirmToken(orderId);
  const confirm = (unpaid?: boolean) =>
    iyzicoConfirmUrl({
      boutiqueSlug,
      customDomain: boutique.customDomain,
      orderId,
      confirmToken,
      unpaid,
    });

  if (!order || !belongs) {
    return new Response("Sipariş bulunamadı.", { status: 404 });
  }

  if (
    order.fulfillmentStatus === "cancelled" ||
    order.paymentStatus === "refunded"
  ) {
    return redirectTo(confirm(true));
  }

  const paidOk = retrieve.status === "success";
  const paymentId = String(retrieve.paymentId ?? "").trim();
  const mismatch = paidOk
    ? iyzicoPaymentMatchesOrder(order, retrieve)
    : "Ödeme tamamlanmadı.";

  if (mismatch || !paymentId) {
    try {
      await abandonUnpaidIyzicoOrder(order);
    } catch (error) {
      console.error("[tr/checkout/iyzico/callback] abandon failed:", error);
    }
    return redirectTo(confirm(true));
  }

  try {
    await captureBoutiqueOrderAsPaid({
      boutique: { id: boutique.id, slug: boutique.slug },
      orderId,
      iyzico: { paymentId, conversationId: orderId },
    });
  } catch (error) {
    console.error("[tr/checkout/iyzico/callback] capture failed:", error);
    return redirectTo(confirm(true));
  }

  return redirectTo(confirm());
}

export async function POST(request: Request) {
  return handleCallback(request);
}

export async function GET(request: Request) {
  return handleCallback(request);
}
