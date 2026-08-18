export type TrIyzicoCredentials = {
  apiKey: string;
  secretKey: string;
  /** Live default `https://api.iyzipay.com`. Sandbox: `https://sandbox-api.iyzipay.com`. */
  baseUrl: string;
};

export type TrIyzicoBuyerProtection = {
  token: string;
  position: "bottomLeft" | "bottomRight" | "topLeft" | "topRight";
  ideaSoft: boolean;
  pwi: boolean;
};

const DEFAULT_LIVE_BASE = "https://api.iyzipay.com";

/**
 * Boutiques that may start iyzico Checkout Form.
 * Credentials stay in env — this list is safe to import from client UI.
 */
const IYZICO_CHECKOUT_SLUGS = new Set(["lilabutik"]);

/**
 * Public overlay token from iyzico merchant panel (Alıcı Koruması).
 * Not an API secret — the widget script reads this in the browser.
 */
const IYZICO_BUYER_PROTECTION_BY_SLUG: Record<string, TrIyzicoBuyerProtection> =
  {
    lilabutik: {
      token: "649afd5a-7bd3-4529-8d26-3c6f6247c984",
      position: "bottomLeft",
      ideaSoft: false,
      pwi: true,
    },
  };

const CREDENTIAL_ENV_BY_SLUG: Record<
  string,
  { apiKey: string; secretKey: string; baseUrl: string }
> = {
  lilabutik: {
    apiKey: "TR_LILABUTIK_IYZICO_API_KEY",
    secretKey: "TR_LILABUTIK_IYZICO_SECURITY_KEY",
    baseUrl: "TR_LILABUTIK_IYZICO_BASE_URL",
  },
};

export function boutiqueOffersIyzicoCheckout(
  boutiqueSlug: string | null | undefined,
): boolean {
  if (!boutiqueSlug) return false;
  return IYZICO_CHECKOUT_SLUGS.has(boutiqueSlug.trim().toLowerCase());
}

export function getIyzicoBuyerProtection(
  boutiqueSlug: string | null | undefined,
): TrIyzicoBuyerProtection | null {
  if (!boutiqueSlug) return null;
  return (
    IYZICO_BUYER_PROTECTION_BY_SLUG[boutiqueSlug.trim().toLowerCase()] ?? null
  );
}

export function getIyzicoCredentials(
  boutiqueSlug: string,
): TrIyzicoCredentials | null {
  const slug = boutiqueSlug.trim().toLowerCase();
  if (!IYZICO_CHECKOUT_SLUGS.has(slug)) return null;
  const names = CREDENTIAL_ENV_BY_SLUG[slug];
  if (!names) return null;
  const apiKey = process.env[names.apiKey]?.trim() ?? "";
  const secretKey = process.env[names.secretKey]?.trim() ?? "";
  if (!apiKey || !secretKey) return null;
  const baseUrl =
    process.env[names.baseUrl]?.trim().replace(/\/$/, "") || DEFAULT_LIVE_BASE;
  return { apiKey, secretKey, baseUrl };
}
