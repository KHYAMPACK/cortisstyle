import { sendBoutiquePasswordReset } from "@/lib/tr/authMail/sendBoutiqueAuthEmail";
import {
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";
import { AUTH_MAIL_RATE_LIMITS } from "@/lib/tr/rateLimitPolicies";

export const runtime = "nodejs";

type Body = {
  email?: string;
  boutiqueSlug?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const boutiqueSlug = (body.boutiqueSlug ?? "").trim().toLowerCase();
  const ip = clientIpFromRequest(request);

  const ipLimit = consumeRateLimit({
    key: `auth-reset:ip:${ip}`,
    ...AUTH_MAIL_RATE_LIMITS.resetPerIp,
  });
  if (!ipLimit.ok) return rateLimitResponse(ipLimit.retryAfterSec);

  if (email && boutiqueSlug) {
    const emailLimit = consumeRateLimit({
      key: `auth-reset:email:${boutiqueSlug}:${email}`,
      ...AUTH_MAIL_RATE_LIMITS.resetPerEmail,
    });
    if (!emailLimit.ok) return rateLimitResponse(emailLimit.retryAfterSec);
  }

  const result = await sendBoutiquePasswordReset({
    email,
    boutiqueSlug,
    requestOrigin: request.headers.get("origin"),
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
