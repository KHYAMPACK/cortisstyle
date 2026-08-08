/**
 * Auth email rate limits — OTP + password reset.
 * Windows are intentionally short for UX, but stop burst spam.
 */

export const AUTH_MAIL_RATE_LIMITS = {
  /** Per email+boutique: signup OTP sends */
  otpPerEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Per IP: signup OTP across all emails */
  otpPerIp: { limit: 20, windowMs: 15 * 60 * 1000 },
  /** Per email+boutique: password reset */
  resetPerEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Per IP: password reset */
  resetPerIp: { limit: 20, windowMs: 15 * 60 * 1000 },
} as const;

/** Checkout POST spam / inventory wipe protection */
export const CHECKOUT_RATE_LIMITS = {
  perIp: { limit: 10, windowMs: 10 * 60 * 1000 },
  perBoutique: { limit: 30, windowMs: 10 * 60 * 1000 },
} as const;
