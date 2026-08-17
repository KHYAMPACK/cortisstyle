import { getShippingProviderId } from "@/lib/tr/shipping/registry";
import { DEFAULT_APPAREL_PACKAGE } from "@/lib/tr/shipping/types";
import type { TrShippingRate, TrShippingTrace } from "@/lib/tr/shipping/types";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

const DEFAULT_BASE = "https://basitkargo.com/api";

export class BasitKargoError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BasitKargoError";
    this.status = status;
  }
}

function parseTokenMap(): Record<string, string> {
  const raw = process.env.TR_SHIPPING_BASITKARGO_TOKENS?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, string> = {};
    for (const [slug, token] of Object.entries(parsed)) {
      const key = slug.trim().toLowerCase();
      const value = token.trim();
      if (key && value) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function getBasitKargoTokenForSlug(boutiqueSlug: string): string | null {
  const slug = boutiqueSlug.trim().toLowerCase();
  if (getShippingProviderId(slug) !== "basitkargo") return null;
  return parseTokenMap()[slug] ?? null;
}

function baseUrl(): string {
  return (
    process.env.TR_SHIPPING_BASITKARGO_BASE_URL?.trim().replace(/\/$/, "") ||
    DEFAULT_BASE
  );
}

function toBkPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

function tlToKurus(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value * 100));
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed * 100));
  }
  return 0;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text.trim()) return `Basit Kargo HTTP ${response.status}`;
  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    const message =
      (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      (typeof json.detail === "string" && json.detail);
    if (message) return message;
  } catch {
    // plain text
  }
  return text.slice(0, 400);
}

async function bkFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...init, headers });
  if (response.status !== 429) return response;

  const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
  const waitMs = Math.min(15_000, Math.max(500, retryAfter * 1000));
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return fetch(url, { ...init, headers });
}

async function bkJson<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await bkFetch(token, path, init);
  if (!response.ok) {
    throw new BasitKargoError(await parseErrorMessage(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type BasitKargoOrderPayload = {
  id: string;
  barcode: string | null;
  type?: string;
  status: string;
  shipmentInfo?: {
    handler?: { name?: string; code?: string };
    handlerShipmentCode?: string | null;
    lastState?: string;
  };
  priceInfo?: {
    shipmentFee?: number;
    totalCost?: number;
  };
  traces?: Array<{ status?: string; time?: string; location?: string }>;
};

export function mapBasitKargoTraces(traces: unknown): TrShippingTrace[] {
  if (!Array.isArray(traces)) return [];
  return traces
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const status = typeof row.status === "string" ? row.status.trim() : "";
      if (!status) return null;
      return {
        status,
        time: typeof row.time === "string" ? row.time : "",
        location: typeof row.location === "string" ? row.location : null,
      } satisfies TrShippingTrace;
    })
    .filter((row): row is TrShippingTrace => row !== null);
}

export function mapOrderToBasitKargoBody(order: TrOrderWithItems): Record<string, unknown> {
  const address = order.shippingAddress;
  const line = [address.line1, address.line2].filter(Boolean).join(" ").trim();
  return {
    type: "OUTGOING",
    content: {
      name: `Sipariş ${order.id.slice(0, 8).toUpperCase()}`,
      code: order.id,
      items: order.items.map((item) => ({
        name: item.title,
        code: item.productId ?? item.id,
        quantity: String(item.quantity),
      })),
      packages: [DEFAULT_APPAREL_PACKAGE],
    },
    client: {
      name: order.customerName,
      phone: toBkPhone(order.customerPhone),
      email: order.customerEmail,
      city: address.city,
      town: address.district,
      address: line || address.city,
    },
  };
}

export async function basitKargoCreateOrder(
  token: string,
  order: TrOrderWithItems,
): Promise<BasitKargoOrderPayload> {
  return bkJson<BasitKargoOrderPayload>(token, "/v2/order", {
    method: "POST",
    body: JSON.stringify(mapOrderToBasitKargoBody(order)),
  });
}

export async function basitKargoUpdateOrder(
  token: string,
  order: TrOrderWithItems,
): Promise<BasitKargoOrderPayload> {
  const externalId = order.shipment.externalId;
  if (!externalId) {
    throw new BasitKargoError("Güncellenecek kargo kaydı yok.", 400);
  }
  return bkJson<BasitKargoOrderPayload>(token, "/v2/order", {
    method: "PUT",
    body: JSON.stringify({
      id: externalId,
      ...mapOrderToBasitKargoBody(order),
    }),
  });
}

export async function basitKargoListFees(
  token: string,
  bkOrderId: string,
): Promise<TrShippingRate[]> {
  const rows = await bkJson<Array<Record<string, unknown>>>(
    token,
    `/v2/order/${encodeURIComponent(bkOrderId)}/fee`,
  );
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      handlerCode: String(row.handlerCode ?? ""),
      handlerName: String(row.handler ?? row.handlerCode ?? "Kargo"),
      feeKurus: tlToKurus(row.fee),
      durationDays:
        typeof row.duration === "number" ? row.duration : null,
      pickupAddress:
        typeof row.pickupAddress === "string" ? row.pickupAddress : null,
    }))
    .filter(
      (row) =>
        row.handlerCode && !row.handlerCode.toUpperCase().startsWith("SELF_"),
    );
}

export async function basitKargoBuyBarcode(
  token: string,
  bkOrderId: string,
  handlerCode: string,
): Promise<BasitKargoOrderPayload> {
  return bkJson<BasitKargoOrderPayload>(
    token,
    `/v2/order/${encodeURIComponent(bkOrderId)}/barcode`,
    {
      method: "POST",
      body: JSON.stringify({ handlerCode }),
    },
  );
}

export async function basitKargoGetOrder(
  token: string,
  bkOrderId: string,
): Promise<BasitKargoOrderPayload> {
  return bkJson<BasitKargoOrderPayload>(
    token,
    `/v2/order/${encodeURIComponent(bkOrderId)}`,
  );
}

export async function basitKargoCancelBarcode(
  token: string,
  barcode: string,
): Promise<void> {
  await bkJson(token, `/order/barcode/${encodeURIComponent(barcode)}`, {
    method: "DELETE",
  });
}

export async function basitKargoGetLabelSvg(
  token: string,
  bkOrderId: string,
): Promise<string> {
  const response = await bkFetch(
    token,
    `/label/svg/${encodeURIComponent(bkOrderId)}`,
  );
  if (!response.ok) {
    throw new BasitKargoError(await parseErrorMessage(response), response.status);
  }
  return response.text();
}

export function feeKurusFromPayload(
  payload: BasitKargoOrderPayload,
): number | null {
  const fee = payload.priceInfo?.shipmentFee ?? payload.priceInfo?.totalCost;
  if (fee == null) return null;
  return tlToKurus(fee);
}

/** Pre-order quote (does not create a Basit shipment or debit balance). */
export async function basitKargoQuotePackageFees(
  token: string,
): Promise<TrShippingRate[]> {
  const rows = await bkJson<Array<Record<string, unknown>>>(
    token,
    "/handlers/fee/packages",
    {
      method: "POST",
      body: JSON.stringify([DEFAULT_APPAREL_PACKAGE]),
    },
  );
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      handlerCode: String(row.handlerCode ?? ""),
      handlerName: String(row.handler ?? row.handlerCode ?? "Kargo"),
      feeKurus: tlToKurus(row.price ?? row.fee),
      durationDays:
        typeof row.duration === "number" ? row.duration : null,
      pickupAddress: null,
    }))
    .filter(
      (row) =>
        row.handlerCode &&
        !row.handlerCode.toUpperCase().startsWith("SELF_") &&
        row.feeKurus > 0,
    )
    .sort((a, b) => a.feeKurus - b.feeKurus);
}
