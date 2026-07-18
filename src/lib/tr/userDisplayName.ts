import type { User } from "@supabase/supabase-js";

function firstToken(value: string): string {
  return value.trim().split(/\s+/)[0] ?? "";
}

function metadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Uppercase first name for Zara-style chrome (e.g. "MERT").
 * Prefers user_metadata, then email local-part.
 */
export function getTrUserFirstName(user: User | null | undefined): string | null {
  if (!user) return null;

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta =
    metadataString(metadata, "first_name") ??
    metadataString(metadata, "full_name") ??
    metadataString(metadata, "name");

  if (fromMeta) {
    const token = firstToken(fromMeta);
    return token ? token.toLocaleUpperCase("tr-TR") : null;
  }

  const local = user.email?.split("@")[0]?.trim();
  if (!local) return null;

  const token = firstToken(local.replace(/[._+-]+/g, " "));
  return token ? token.toLocaleUpperCase("tr-TR") : null;
}
