import {
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";
import { SHIPPING_QUOTE_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";
import {
  canonicalTurkeyCity,
  canonicalTurkeyDistrict,
} from "@/lib/tr/geo/turkeyAddress";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import { quoteCheckoutShippingFee } from "@/lib/tr/shipping/quoteShipping";

export const runtime = "nodejs";

/**
 * POST /api/tr/shipping/quote
 * { boutiqueSlug, city, district, itemCount? } — fee is the server flat rate
 * (0 when itemCount >= 2); city/district must be on the TR list.
 */
export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = consumeRateLimit({
    key: `shipping-quote:${ip}`,
    ...SHIPPING_QUOTE_RATE_LIMITS.perIp,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueSlug =
    typeof body.boutiqueSlug === "string" ? body.boutiqueSlug.trim() : "";
  if (!boutiqueSlug || !boutiqueHasLiveShipping(boutiqueSlug)) {
    return Response.json({ feeKurus: 0, live: false });
  }

  const city = canonicalTurkeyCity(
    typeof body.city === "string" ? body.city : "",
  );
  const district = city
    ? canonicalTurkeyDistrict(
        city,
        typeof body.district === "string" ? body.district : "",
      )
    : null;
  if (!city || !district) {
    return Response.json(
      { error: "İl ve ilçe listeden seçilmelidir." },
      { status: 400 },
    );
  }

  try {
    const rawCount = body.itemCount;
    const itemCount =
      typeof rawCount === "number" && Number.isFinite(rawCount)
        ? Math.max(0, Math.floor(rawCount))
        : 1;
    const quote = quoteCheckoutShippingFee(boutiqueSlug, itemCount);
    if (!quote) {
      return Response.json({ feeKurus: 0, live: false });
    }
    return Response.json({
      live: true,
      feeKurus: quote.feeKurus,
      handlerCode: quote.handlerCode,
    });
  } catch (error) {
    console.error("[shipping/quote]", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kargo ücreti alınamadı.",
      },
      { status: 502 },
    );
  }
}
