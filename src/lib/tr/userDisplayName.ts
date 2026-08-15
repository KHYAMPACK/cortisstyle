import type { AuthUser } from "@/types/user";

function firstToken(value: string): string {
  return value.trim().split(/[\s_]+/)[0] ?? "";
}

/**
 * Uppercase first name for Zara-style chrome (e.g. "MERT").
 * Prefers signup firstName, then displayLabel, then email local-part.
 */
export function getTrUserFirstName(
  user:
    | Pick<AuthUser, "email" | "displayLabel" | "firstName">
    | null
    | undefined,
): string | null {
  if (!user) return null;

  if (user.firstName?.trim()) {
    const token = firstToken(user.firstName);
    return token ? token.toLocaleUpperCase("tr-TR") : null;
  }

  if (user.displayLabel?.trim()) {
    const token = firstToken(user.displayLabel);
    return token ? token.toLocaleUpperCase("tr-TR") : null;
  }

  const local = user.email?.split("@")[0]?.trim();
  if (!local) return null;

  const token = firstToken(local.replace(/[._+-]+/g, " "));
  return token ? token.toLocaleUpperCase("tr-TR") : null;
}

/** Header chrome: first name when signed in, otherwise "Hesap". */
export function getTrAccountChromeLabel(
  user:
    | Pick<AuthUser, "firstName">
    | null
    | undefined,
  isAuthenticated: boolean,
): string {
  if (!isAuthenticated) return "Hesap";
  const token = user?.firstName?.trim()
    ? firstToken(user.firstName)
    : "";
  return token ? token.toLocaleUpperCase("tr-TR") : "Hesap";
}
