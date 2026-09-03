import {
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";

/** Customer reference photo uploads (print-on-demand PDP). */
export const CUSTOMER_REFERENCE_UPLOAD_RATE_LIMITS = {
  perIp: { limit: 20, windowMs: 10 * 60 * 1000 },
  perBoutique: { limit: 60, windowMs: 10 * 60 * 1000 },
} as const;

export async function enforceCustomerReferenceUploadRateLimit(
  request: Request,
  boutiqueId: string,
): Promise<Response | null> {
  const ip = clientIpFromRequest(request);
  const ipLimit = consumeRateLimit({
    key: `customer-ref-upload:ip:${ip}`,
    limit: CUSTOMER_REFERENCE_UPLOAD_RATE_LIMITS.perIp.limit,
    windowMs: CUSTOMER_REFERENCE_UPLOAD_RATE_LIMITS.perIp.windowMs,
  });
  if (!ipLimit.ok) {
    return rateLimitResponse(ipLimit.retryAfterSec);
  }

  const boutiqueLimit = consumeRateLimit({
    key: `customer-ref-upload:boutique:${boutiqueId}`,
    limit: CUSTOMER_REFERENCE_UPLOAD_RATE_LIMITS.perBoutique.limit,
    windowMs: CUSTOMER_REFERENCE_UPLOAD_RATE_LIMITS.perBoutique.windowMs,
  });
  if (!boutiqueLimit.ok) {
    return rateLimitResponse(boutiqueLimit.retryAfterSec);
  }

  return null;
}
