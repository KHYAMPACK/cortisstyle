import { cache } from "react";
import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { decryptIntegrationCredentials } from "@/lib/tr/payments/credentialEncryption";

export type TrIyzicoCredentials = {
  apiKey: string;
  secretKey: string;
  /** Live default `https://api.iyzipay.com`. Sandbox: `https://sandbox-api.iyzipay.com`. */
  baseUrl: string;
};

export type TrIyzicoBuyerProtectionPosition =
  | "bottomLeft"
  | "bottomRight"
  | "topLeft"
  | "topRight"
  | "header";

export type TrIyzicoBuyerProtection = {
  token: string;
  /** Desktop / wide viewports. */
  position: TrIyzicoBuyerProtectionPosition;
  /**
   * Phones. iyzico’s `header` slot is the full-width “iyzico ile öde” bar
   * (merchant panel snippet). Shown on the boutique homepage only.
   * Corner badges are easy to miss under 380px+ and get clipped by
   * `overflow-x: clip` on body.
   */
  mobilePosition?: TrIyzicoBuyerProtectionPosition;
  ideaSoft: boolean;
  pwi: boolean;
};

/** Match Tailwind `md` so the header bar is phones-only. */
export const IYZICO_BUYER_PROTECTION_HEADER_MAX_PX = 767;

const DEFAULT_LIVE_BASE = "https://api.iyzipay.com";

type TrBoutiqueIyzicoIntegrationRow = {
  enabled: boolean;
  credentials_encrypted: string | null;
  metadata: unknown;
};

type TrIyzicoStoredCredentials = {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
};

function isIyzicoBuyerProtectionMetadata(
  value: unknown,
): value is TrIyzicoBuyerProtection {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.token === "string" &&
    typeof v.position === "string" &&
    typeof v.ideaSoft === "boolean" &&
    typeof v.pwi === "boolean"
  );
}

/** Memoized per request (React `cache`) — at most one DB round trip per slug per render. */
const getIyzicoIntegration = cache(async function getIyzicoIntegration(
  slug: string,
): Promise<TrBoutiqueIyzicoIntegrationRow | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data: boutique } = await supabase
    .from("tr_boutiques")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!boutique) return null;

  const { data, error } = await supabase
    .from("tr_boutique_integrations")
    .select("enabled, credentials_encrypted, metadata")
    .eq("boutique_id", boutique.id as string)
    .eq("provider", "iyzico")
    .maybeSingle();
  if (error || !data) return null;
  return data as TrBoutiqueIyzicoIntegrationRow;
});

export async function boutiqueOffersIyzicoCheckout(
  boutiqueSlug: string | null | undefined,
): Promise<boolean> {
  if (!boutiqueSlug) return false;
  const slug = boutiqueSlug.trim().toLowerCase();
  const integration = await getIyzicoIntegration(slug);
  return integration?.enabled ?? false;
}

export async function getIyzicoBuyerProtection(
  boutiqueSlug: string | null | undefined,
): Promise<TrIyzicoBuyerProtection | null> {
  if (!boutiqueSlug) return null;
  const slug = boutiqueSlug.trim().toLowerCase();
  const integration = await getIyzicoIntegration(slug);
  if (integration && isIyzicoBuyerProtectionMetadata(integration.metadata)) {
    return integration.metadata;
  }
  return null;
}

export async function getIyzicoCredentials(
  boutiqueSlug: string,
): Promise<TrIyzicoCredentials | null> {
  const slug = boutiqueSlug.trim().toLowerCase();
  const integration = await getIyzicoIntegration(slug);
  if (!integration?.credentials_encrypted) return null;

  try {
    const stored = decryptIntegrationCredentials<TrIyzicoStoredCredentials>(
      integration.credentials_encrypted,
    );
    if (!stored.apiKey || !stored.secretKey) return null;
    return {
      apiKey: stored.apiKey,
      secretKey: stored.secretKey,
      baseUrl: stored.baseUrl?.trim().replace(/\/$/, "") || DEFAULT_LIVE_BASE,
    };
  } catch (error) {
    console.error(
      `[payments/registry] failed to decrypt iyzico credentials for ${slug}:`,
      error,
    );
    return null;
  }
}
