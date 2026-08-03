import { getServiceSupabase } from "@/lib/supabaseAdmin";

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
