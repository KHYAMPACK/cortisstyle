import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string | null;
  displayLabel: string;
}

/** @deprecated Use AuthUser — temporary alias for TR display helpers. */
export type WardrobeUser = AuthUser;

export function mapSupabaseUser(user: User): AuthUser {
  const email = user.email ?? null;

  return {
    id: user.id,
    email,
    displayLabel: email
      ? (email.split("@")[0]?.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase() ??
        user.id.slice(0, 8).toUpperCase())
      : user.id.slice(0, 8).toUpperCase(),
  };
}
