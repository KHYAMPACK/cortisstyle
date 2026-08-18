import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { ensureDraftInvoiceForBoutiqueOrder } from "@/lib/tr/invoices";
import {
  getOrderByIdAdmin,
  updateOrderFulfillmentStatusAdmin,
  updateOrderPaymentStatusAdmin,
} from "@/lib/tr/orders";
import { autoFulfillPaidShipment, cancelLiveShipmentForCancelledOrder } from "@/lib/tr/shipping/ownerShipment";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import type {
  TrFulfillmentStatus,
  TrPaymentStatus,
} from "@/types/tr-marketplace";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const FULFILLMENT: TrFulfillmentStatus[] = [
  "created",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

/**
 * GET /api/tr/owner/orders/[id]?boutiqueId=
 * PATCH /api/tr/owner/orders/[id] { boutiqueId, fulfillmentStatus? | paymentStatus?: "paid" }
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  if (!boutiqueId) {
    return Response.json({ error: "boutiqueId zorunlu." }, { status: 400 });
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const order = await getOrderByIdAdmin(id);
  if (!order || !order.items.some((item) => item.boutiqueId === boutique.id)) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  if (
    boutiqueOffersIyzicoCheckout(boutique.slug) &&
    !order.isSandbox &&
    (order.paymentStatus === "pending" || order.paymentStatus === "failed")
  ) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const scopedItems = order.items.filter(
    (item) => item.boutiqueId === boutique.id,
  );
  const boutiqueSubtotal = scopedItems.reduce(
    (sum, item) => sum + item.priceKurus * item.quantity,
    0,
  );

  return Response.json({
    boutique: {
      id: boutique.id,
      slug: boutique.slug,
      name: boutique.name,
    },
    order: {
      ...order,
      items: scopedItems,
      // Keep order-level totals; UI should show discount breakdown.
      boutiqueSubtotalKurus: boutiqueSubtotal,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueId =
    typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const existing = await getOrderByIdAdmin(id);
  if (
    !existing ||
    !existing.items.some((item) => item.boutiqueId === boutique.id)
  ) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const cardCheckout = boutiqueOffersIyzicoCheckout(boutique.slug);
  if (
    cardCheckout &&
    !existing.isSandbox &&
    (existing.paymentStatus === "pending" ||
      existing.paymentStatus === "failed")
  ) {
    return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const fulfillmentStatus = body.fulfillmentStatus;
  const paymentStatus = body.paymentStatus;

  const hasFulfillment =
    typeof fulfillmentStatus === "string" &&
    FULFILLMENT.includes(fulfillmentStatus as TrFulfillmentStatus);
  const hasPayment =
    paymentStatus === "paid" &&
    (existing.paymentStatus === "pending" ||
      existing.paymentStatus === "failed");

  if (hasPayment && cardCheckout) {
    return Response.json(
      { error: "Kart ödemesi iyzico ile alınır." },
      { status: 409 },
    );
  }

  if (!hasFulfillment && !hasPayment) {
    return Response.json(
      { error: "Geçersiz sipariş veya ödeme durumu." },
      { status: 400 },
    );
  }

  try {
    if (hasPayment) {
      await updateOrderPaymentStatusAdmin(id, "paid" as TrPaymentStatus);
      try {
        await ensureDraftInvoiceForBoutiqueOrder(boutique.id, id);
      } catch (invoiceError) {
        console.error(
          "[tr/owner/orders/[id]] invoice draft after paid failed:",
          invoiceError,
        );
      }
      await autoFulfillPaidShipment(
        { id: boutique.id, slug: boutique.slug },
        id,
      );
    }
    if (hasFulfillment) {
      if (
        fulfillmentStatus === "cancelled" &&
        existing.fulfillmentStatus !== "cancelled"
      ) {
        await cancelLiveShipmentForCancelledOrder(
          { id: boutique.id, slug: boutique.slug },
          id,
        );
      }
      await updateOrderFulfillmentStatusAdmin(
        id,
        fulfillmentStatus as TrFulfillmentStatus,
      );
    }
    const order = await getOrderByIdAdmin(id);
    if (!order) {
      return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }
    return Response.json({
      order: {
        ...order,
        items: order.items.filter((item) => item.boutiqueId === boutique.id),
      },
    });
  } catch (error) {
    console.error("[tr/owner/orders/[id]] patch failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Sipariş güncellenemedi.",
      },
      { status: 500 },
    );
  }
}
