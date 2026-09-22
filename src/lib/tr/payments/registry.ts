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

/**
 * Fallback maps, read only when a boutique has no `tr_boutique_integrations`
 * row yet. Once lilabutik's row is seeded and verified (Phase 1 §3 dual-read
 * step), these — and this whole fallback path — get deleted; no other
 * boutique needs to keep working through this transition.
 */
const IYZICO_CHECKOUT_SLUGS = new Set(["lilabutik"]);

const IYZICO_BUYER_PROTECTION_BY_SLUG: Record<string, TrIyzicoBuyerProtection> =
  {
    lilabutik: {
      token: "649afd5a-7bd3-4529-8d26-3c6f6247c984",
      position: "bottomLeft",
      mobilePosition: "header",
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
  if (integration) return integration.enabled;
  return IYZICO_CHECKOUT_SLUGS.has(slug);
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
  return IYZICO_BUYER_PROTECTION_BY_SLUG[slug] ?? null;
}

export async function getIyzicoCredentials(
  boutiqueSlug: string,
): Promise<TrIyzicoCredentials | null> {
  const slug = boutiqueSlug.trim().toLowerCase();
  const integration = await getIyzicoIntegration(slug);
  if (integration?.credentials_encrypted) {
    try {
      const stored = decryptIntegrationCredentials<TrIyzicoStoredCredentials>(
        integration.credentials_encrypted,
      );
      if (stored.apiKey && stored.secretKey) {
        return {
          apiKey: stored.apiKey,
          secretKey: stored.secretKey,
          baseUrl:
            stored.baseUrl?.trim().replace(/\/$/, "") || DEFAULT_LIVE_BASE,
        };
      }
    } catch (error) {
      console.error(
        `[payments/registry] failed to decrypt iyzico credentials for ${slug}:`,
        error,
      );
    }
  }

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
