import { getSupabaseClient } from "@/lib/supabaseClient";
import type { SignupDiscoverySourceId } from "@/lib/auth/signupDiscoverySources";

export type UserProfileContact = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  signupDiscoverySource?: SignupDiscoverySourceId | null;
  signupDiscoveryBoutiqueSlug?: string | null;
};

export async function ensureUserProfile(
  userId: string,
  email?: string | null,
  contact?: UserProfileContact,
) {
  const supabase = getSupabaseClient();
  const row: {
    id: string;
    email: string | null;
    updated_at: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    signup_discovery_source?: string | null;
    signup_discovery_boutique_slug?: string | null;
  } = {
    id: userId,
    email: email ?? null,
    updated_at: new Date().toISOString(),
  };

  if (contact?.firstName !== undefined) {
    row.first_name = contact.firstName?.trim() || null;
  }
  if (contact?.lastName !== undefined) {
    row.last_name = contact.lastName?.trim() || null;
  }
  if (contact?.phone !== undefined) {
    row.phone = contact.phone?.trim() || null;
  }
  if (contact?.signupDiscoverySource !== undefined) {
    row.signup_discovery_source = contact.signupDiscoverySource;
  }
  if (contact?.signupDiscoveryBoutiqueSlug !== undefined) {
    row.signup_discovery_boutique_slug =
      contact.signupDiscoveryBoutiqueSlug?.trim().toLowerCase() || null;
  }

  const { error } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
  });

  if (!error) return;

  const withoutDiscovery = {
    id: row.id,
    email: row.email,
    updated_at: row.updated_at,
    ...(row.first_name !== undefined ? { first_name: row.first_name } : {}),
    ...(row.last_name !== undefined ? { last_name: row.last_name } : {}),
    ...(row.phone !== undefined ? { phone: row.phone } : {}),
  };

  if (
    contact?.signupDiscoverySource !== undefined ||
    contact?.signupDiscoveryBoutiqueSlug !== undefined
  ) {
    const { error: contactError } = await supabase
      .from("profiles")
      .upsert(withoutDiscovery, { onConflict: "id" });
    if (!contactError) {
      console.error("Profile discovery fields not persisted:", error.message);
      return;
    }
  }

  // Columns missing until patch_tr_customer_profile_fields.sql is applied.
  const { error: fallbackError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      updated_at: row.updated_at,
    },
    { onConflict: "id" },
  );

  if (fallbackError) {
    throw fallbackError;
  }

  console.error("Profile contact fields not persisted:", error.message);
}
