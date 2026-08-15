import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  displayLabel: string;
}

/** @deprecated Use AuthUser — temporary alias for TR display helpers. */
export type WardrobeUser = AuthUser;

function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function mapSupabaseUser(user: User): AuthUser {
  const email = user.email ?? null;
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const firstName = metaString(metadata, "first_name");
  const lastName = metaString(metadata, "last_name");
  const phone = metaString(metadata, "phone");

  return {
    id: user.id,
    email,
    firstName,
    lastName,
    phone,
    displayLabel: email
      ? (email.split("@")[0]?.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase() ??
        user.id.slice(0, 8).toUpperCase())
      : user.id.slice(0, 8).toUpperCase(),
  };
}
