import type { AuthUser } from "@/types/user";

function firstToken(value: string): string {
  return value.trim().split(/[\s_]+/)[0] ?? "";
}

/**
 * Uppercase first name for Zara-style chrome (e.g. "MERT").
 * Uses AuthUser.displayLabel, then email local-part.
 */
export function getTrUserFirstName(
  user: Pick<AuthUser, "email" | "displayLabel"> | null | undefined,
): string | null {
  if (!user) return null;

  if (user.displayLabel?.trim()) {
    const token = firstToken(user.displayLabel);
    return token ? token.toLocaleUpperCase("tr-TR") : null;
  }

  const local = user.email?.split("@")[0]?.trim();
  if (!local) return null;

  const token = firstToken(local.replace(/[._+-]+/g, " "));
  return token ? token.toLocaleUpperCase("tr-TR") : null;
}
