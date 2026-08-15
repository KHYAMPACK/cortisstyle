export type AuthErrorKind =
  | "invalid_credentials"
  | "invalid_otp"
  | "otp_expired"
  | "rate_limit"
  | "email_not_confirmed"
  | "weak_password"
  | "same_password"
  | "network"
  | "generic";

const COPY: Record<AuthErrorKind, { en: string; tr: string }> = {
  invalid_credentials: {
    tr: "E-posta veya şifre hatalı. Tekrar deneyin.",
    en: "Email or password is incorrect. Try again.",
  },
  invalid_otp: {
    tr: "Kod hatalı. Kontrol edip tekrar girin.",
    en: "That code is incorrect. Check it and try again.",
  },
  otp_expired: {
    tr: "Kodun süresi doldu. Yeni kod isteyin.",
    en: "That code expired. Request a new one.",
  },
  rate_limit: {
    tr: "Çok fazla deneme. Biraz bekleyip tekrar deneyin.",
    en: "Too many attempts. Wait a moment and try again.",
  },
  email_not_confirmed: {
    tr: "E-posta henüz doğrulanmadı. Gelen kutunuzdaki kodu girin.",
    en: "Email is not verified yet. Enter the code from your inbox.",
  },
  weak_password: {
    tr: "Şifre en az 6 karakter olmalı.",
    en: "Password must be at least 6 characters.",
  },
  same_password: {
    tr: "Yeni şifre eskisinden farklı olmalı.",
    en: "New password must be different from the current one.",
  },
  network: {
    tr: "Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.",
    en: "Connection error. Check your network and try again.",
  },
  generic: {
    tr: "İşlem tamamlanamadı. Tekrar deneyin.",
    en: "Something went wrong. Please try again.",
  },
};

export function classifyAuthError(
  message: string | null | undefined,
  code?: string | null,
): AuthErrorKind {
  const normalized = `${code ?? ""} ${message ?? ""}`.toLowerCase();

  if (
    normalized.includes("invalid login") ||
    normalized.includes("invalid_credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "invalid_credentials";
  }
  if (
    normalized.includes("otp_expired") ||
    normalized.includes("token has expired")
  ) {
    return "otp_expired";
  }
  if (
    normalized.includes("invalid token") ||
    normalized.includes("token is invalid") ||
    normalized.includes("otp_disabled") ||
    (normalized.includes("otp") && normalized.includes("invalid"))
  ) {
    return "invalid_otp";
  }
  if (
    normalized.includes("rate limit") ||
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("for security purposes") ||
    normalized.includes("too many requests")
  ) {
    return "rate_limit";
  }
  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed")
  ) {
    return "email_not_confirmed";
  }
  if (
    normalized.includes("at least 6") ||
    (normalized.includes("password") && normalized.includes("weak"))
  ) {
    return "weak_password";
  }
  if (normalized.includes("different from the old password")) {
    return "same_password";
  }
  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("fetch")
  ) {
    return "network";
  }

  return "generic";
}

export function localizeAuthError(
  message: string | null | undefined,
  locale: "en" | "tr",
  code?: string | null,
): string | null {
  if (!message?.trim() && !code?.trim()) return null;
  const kind = classifyAuthError(message, code);
  return COPY[kind][locale];
}
