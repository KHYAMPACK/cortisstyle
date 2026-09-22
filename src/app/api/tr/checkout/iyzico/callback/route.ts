import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { createOrderConfirmToken } from "@/lib/tr/orderConfirmToken";
import { getOrderByIdAdmin } from "@/lib/tr/orders";
import { abandonUnpaidIyzicoOrder } from "@/lib/tr/payments/abandonUnpaid";
import { captureBoutiqueOrderAsPaid } from "@/lib/tr/payments/capturePaidOrder";
import { IyzicoError, iyzicoRetrieveCheckoutForm } from "@/lib/tr/payments/iyzicoClient";
import {
  iyzicoPaymentMatchesOrder,
  iyzicoTextId,
  resolveIyzicoCallbackOrderId,
} from "@/lib/tr/payments/iyzicoFormat";
import { getIyzicoCredentials } from "@/lib/tr/payments/registry";
import { iyzicoConfirmUrl } from "@/lib/tr/payments/startCheckoutForm";
import {
  clientIpFromRequest,
  consumeRateLimit,
} from "@/lib/tr/rateLimit";
import { CHECKOUT_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";

export const runtime = "nodejs";

type CallbackFields = { token: string; conversationId: string };

function redirectTo(url: string, status = 303): Response {
  return Response.redirect(url, status);
}

async function fieldsFromRequest(request: Request): Promise<CallbackFields> {
  const url = new URL(request.url);
  const fromQuery: CallbackFields = {
    token: url.searchParams.get("token")?.trim() ?? "",
    conversationId: url.searchParams.get("conversationId")?.trim() ?? "",
  };

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as {
        token?: string;
        conversationId?: string;
      };
      return {
        token: body.token?.trim() || fromQuery.token,
        conversationId: body.conversationId?.trim() || fromQuery.conversationId,
      };
    } catch {
      return fromQuery;
    }
  }

  if (request.method === "GET") return fromQuery;

  try {
    const form = await request.formData();
    return {
      token: String(form.get("token") ?? "").trim() || fromQuery.token,
      conversationId:
        String(form.get("conversationId") ?? "").trim() ||
        fromQuery.conversationId,
    };
  } catch {
    return fromQuery;
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
  const creds = await getIyzicoCredentials(boutiqueSlug);
  if (!boutique || !creds) {
    return new Response("Ödeme yapılandırması yok.", { status: 404 });
  }

  const orderFromQuery = url.searchParams.get("order")?.trim() ?? "";
  const { token, conversationId: conversationFromCallback } =
    await fieldsFromRequest(request);
  if (!token) {
    return new Response("Ödeme jetonu eksik.", { status: 400 });
  }

  const conversationForRetrieve =
    orderFromQuery || conversationFromCallback || undefined;

  let retrieve;
  try {
    retrieve = await iyzicoRetrieveCheckoutForm(creds, {
      token,
      conversationId: conversationForRetrieve,
    });
  } catch (error) {
    console.error("[tr/checkout/iyzico/callback] retrieve failed:", error);
    return new Response(
      error instanceof IyzicoError ? error.message : "Ödeme doğrulanamadı.",
      { status: 502 },
    );
  }

  const orderId = resolveIyzicoCallbackOrderId({
    orderFromQuery,
    conversationFromCallback,
    retrieve,
  });
  if (!orderId) {
    console.error("[tr/checkout/iyzico/callback] missing order id", {
      status: retrieve.status,
      errorCode: retrieve.errorCode,
      errorMessage: retrieve.errorMessage,
      paymentStatus: retrieve.paymentStatus,
      hasBasketId: Boolean(iyzicoTextId(retrieve.basketId)),
    });
    return new Response(
      retrieve.errorMessage?.trim() || "Sipariş eşleşmedi.",
      { status: 400 },
    );
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
