import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { resolveBoutiqueBrandLabel } from "@/lib/tr/boutiqueBrand";
import type { EmailAccountOrigin } from "@/lib/authTypes";

export type EnsureTrCustomerProfileInput = {
  userId: string;
  boutiqueId: string | null;
  boutiqueSlug: string | null;
  host: string | null;
};

/**
 * Records first-registration boutique attribution once.
 * Subsequent calls are no-ops if a profile row already exists.
 */
export async function ensureTrCustomerProfile(
  input: EnsureTrCustomerProfileInput,
): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;

  const { data: existing, error: readError } = await supabase
    .from("tr_customer_profiles")
    .select("user_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (readError) {
    console.error("tr_customer_profiles read failed:", readError.message);
    return;
  }
  if (existing) return;

  const { error: insertError } = await supabase.from("tr_customer_profiles").insert({
    user_id: input.userId,
    primary_registration_boutique_id: input.boutiqueId,
    primary_registration_slug: input.boutiqueSlug,
    primary_registration_host: input.host,
  });

  if (insertError) {
    // Race: another request inserted first — ignore unique violation.
    console.error("tr_customer_profiles insert failed:", insertError.message);
  }
}

/**
 * Returns primary registration boutique for cross-store login notices.
 * Service-role only (used during unauthenticated email checks).
 */
export async function getTrCustomerAccountOrigin(
  userId: string,
): Promise<EmailAccountOrigin | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tr_customer_profiles")
    .select("primary_registration_slug, primary_registration_boutique_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("tr_customer_profiles origin read failed:", error.message);
    return null;
  }

  const slug = data?.primary_registration_slug?.trim().toLowerCase() || null;
  if (!slug) return null;

  let boutiqueName: string | null = null;
  const boutiqueId = data?.primary_registration_boutique_id as string | null;
  if (boutiqueId) {
    const { data: boutique } = await supabase
      .from("tr_boutiques")
      .select("name, slug")
      .eq("id", boutiqueId)
      .maybeSingle();
    boutiqueName = boutique?.name?.trim() || null;
  }

  if (!boutiqueName) {
    const { data: boutique } = await supabase
      .from("tr_boutiques")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();
    boutiqueName = boutique?.name?.trim() || null;
  }

  return {
    boutiqueSlug: slug,
    boutiqueName: resolveBoutiqueBrandLabel(slug, boutiqueName),
  };
}
