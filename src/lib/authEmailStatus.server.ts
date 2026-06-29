import type { User } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  isPasswordSetInMetadata,
  type EmailAuthRoute,
  type EmailAuthStatus,
} from "@/lib/authTypes";

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

export async function resolveEmailAuthStatusServer(
  email: string,
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

  if (passwordSet || profile) {
    return { route: "login" };
  }

  return { route: "complete_signup" };
}
