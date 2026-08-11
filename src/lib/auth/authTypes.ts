export type EmailAuthRoute =
  | "signup"
  | "verify_signup"
  | "complete_signup"
  | "login";

/** Where the shopper first registered on a TR boutique (immutable attribution). */
export type EmailAccountOrigin = {
  boutiqueSlug: string;
  boutiqueName: string;
};

export interface EmailAuthStatus {
  route: EmailAuthRoute;
  /**
   * Set when the account already exists and the check was made from a boutique
   * whose slug differs from the primary registration boutique.
   */
  accountOrigin?: EmailAccountOrigin | null;
}

export type ResolveEmailAuthOptions = {
  /** Current boutique storefront slug (enables cross-boutique origin notice). */
  boutiqueSlug?: string | null;
};

export function isPasswordSetInMetadata(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.password_set === true;
}
