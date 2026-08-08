import { createHmac, timingSafeEqual } from "node:crypto";

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

function secret(): string | null {
  const value =
    process.env.TR_ORDER_CONFIRM_SECRET?.trim() ||
    process.env.TR_ADMIN_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  return value || null;
}

function requireSecret(): string {
  const value = secret();
  if (value) return value;
  if (isProductionRuntime()) {
    throw new Error(
      "TR_ORDER_CONFIRM_SECRET (or TR_ADMIN_SECRET) must be set in production.",
    );
  }
  return "cortis-dev-order-confirm";
}

/** Opaque capability token so confirmation URLs aren't bare UUID IDOR. */
export function createOrderConfirmToken(orderId: string): string {
  return createHmac("sha256", requireSecret())
    .update(`tr-order-confirm:${orderId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyOrderConfirmToken(
  orderId: string,
  token: string | null | undefined,
): boolean {
  const provided = token?.trim() ?? "";
  if (!provided || provided.length < 16) return false;
  if (isProductionRuntime() && !secret()) return false;
  try {
    const expected = createOrderConfirmToken(orderId);
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
