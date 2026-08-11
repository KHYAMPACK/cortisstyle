import type {
  EmailAccountOrigin,
  EmailAuthRoute,
  EmailAuthStatus,
  ResolveEmailAuthOptions,
} from "@/lib/authTypes";

function isAlreadyRegisteredError(message: string, code?: string): boolean {
  const normalized = message.toLowerCase();
  return (
    code === "user_already_exists" ||
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists")
  );
}

export async function resolveEmailAuthStatus(
  email: string,
  options?: ResolveEmailAuthOptions,
): Promise<EmailAuthStatus> {
  const boutiqueSlug = options?.boutiqueSlug?.trim().toLowerCase() || null;

  const response = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      ...(boutiqueSlug ? { boutiqueSlug } : {}),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    route?: EmailAuthRoute;
    accountOrigin?: EmailAccountOrigin | null;
    error?: string;
    fallback?: boolean;
  };

  if (response.ok && body.route) {
    return {
      route: body.route,
      ...(body.accountOrigin ? { accountOrigin: body.accountOrigin } : {}),
    };
  }

  if (response.status === 503 && body.fallback) {
    return probeEmailAuthStatusViaSignUp(email);
  }

  throw new Error(body.error ?? "Unable to verify email address.");
}

/** Client fallback when service-role lookup is unavailable. */
async function probeEmailAuthStatusViaSignUp(
  email: string,
): Promise<EmailAuthStatus> {
  const { getSupabaseClient } = await import("@/lib/supabaseClient");
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: crypto.randomUUID(),
  });

  if (!error) {
    return { route: "signup" };
  }

  if (isAlreadyRegisteredError(error.message, error.code)) {
    // Auth user exists — likely unverified signup. Never assume password login.
    return { route: "verify_signup" };
  }

  throw new Error(error.message);
}
