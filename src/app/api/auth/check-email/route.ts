import { resolveEmailAuthStatusServer } from "@/lib/authEmailStatus.server";
import { getServiceSupabase, isValidNotifyEmail } from "@/lib/supabaseAdmin";
import {
  clientIpFromRequest,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/tr/rateLimit";

export const runtime = "nodejs";

interface CheckEmailPayload {
  email?: string;
  boutiqueSlug?: string;
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const ipLimit = consumeRateLimit({
    key: `auth-check-email:ip:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!ipLimit.ok) {
    return rateLimitResponse(ipLimit.retryAfterSec);
  }

  let payload: CheckEmailPayload;

  try {
    payload = (await request.json()) as CheckEmailPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const boutiqueSlug = payload.boutiqueSlug?.trim().toLowerCase() || null;

  if (!isValidNotifyEmail(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const emailLimit = consumeRateLimit({
    key: `auth-check-email:email:${email}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!emailLimit.ok) {
    return rateLimitResponse(emailLimit.retryAfterSec);
  }

  const admin = getServiceSupabase();

  if (!admin) {
    return Response.json(
      {
        error:
          "Email lookup is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
        fallback: true,
      },
      { status: 503 },
    );
  }

  try {
    const status = await resolveEmailAuthStatusServer(email, { boutiqueSlug });

    if (!status) {
      return Response.json(
        { error: "Unable to resolve email status.", fallback: true },
        { status: 503 },
      );
    }

    return Response.json({
      route: status.route,
      ...(status.accountOrigin
        ? { accountOrigin: status.accountOrigin }
        : {}),
    });
  } catch (error) {
    console.error("Auth email check failed:", error);
    return Response.json(
      { error: "Unable to verify email address." },
      { status: 500 },
    );
  }
}
