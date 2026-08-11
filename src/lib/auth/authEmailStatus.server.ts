import type { User } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  isPasswordSetInMetadata,
  type EmailAuthStatus,
  type ResolveEmailAuthOptions,
} from "@/lib/authTypes";
import { getTrCustomerAccountOrigin } from "@/lib/tr/customerProfiles";

async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = getServiceSupabase();
  if (!admin) return null;

  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    );

    if (match) {
      return match;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

async function attachCrossBoutiqueOrigin(
  status: EmailAuthStatus,
  userId: string,
  options?: ResolveEmailAuthOptions,
): Promise<EmailAuthStatus> {
  const currentSlug = options?.boutiqueSlug?.trim().toLowerCase() || null;
  if (!currentSlug) {
    return status;
  }

  // Origin notice only matters once the shopper can log in with a password.
  if (status.route !== "login" && status.route !== "complete_signup") {
    return status;
  }

  const origin = await getTrCustomerAccountOrigin(userId);
  if (!origin) {
    return status;
  }

  if (origin.boutiqueSlug === currentSlug) {
    return status;
  }

  return {
    ...status,
    accountOrigin: origin,
  };
}

export async function resolveEmailAuthStatusServer(
  email: string,
  options?: ResolveEmailAuthOptions,
): Promise<EmailAuthStatus | null> {
  const admin = getServiceSupabase();
  if (!admin) {
    return null;
  }

  const authUser = await findAuthUserByEmail(email);

  if (!authUser) {
    return { route: "signup" };
  }

  const emailConfirmed = Boolean(authUser.email_confirmed_at);
  const passwordSet = isPasswordSetInMetadata(authUser.user_metadata);

  if (!emailConfirmed) {
    return { route: "verify_signup" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const base: EmailAuthStatus =
    passwordSet || profile
      ? { route: "login" }
      : { route: "complete_signup" };

  return attachCrossBoutiqueOrigin(base, authUser.id, options);
}
