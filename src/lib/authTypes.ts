export type EmailAuthRoute =
  | "signup"
  | "verify_signup"
  | "complete_signup"
  | "login";

export interface EmailAuthStatus {
  route: EmailAuthRoute;
}

export function isPasswordSetInMetadata(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.password_set === true;
}
