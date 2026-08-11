import { getServiceSupabase } from "@/lib/supabaseAdmin";

export interface TrOwnerPushSubscription {
  id: string;
  boutiqueId: string;
  ownerUserId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): TrOwnerPushSubscription {
  return {
    id: String(row.id),
    boutiqueId: String(row.boutique_id),
    ownerUserId: String(row.owner_user_id),
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    auth: String(row.auth),
    userAgent: (row.user_agent as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function upsertOwnerPushSubscription(input: {
  boutiqueId: string;
  ownerUserId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}): Promise<TrOwnerPushSubscription> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_owner_push_subscriptions")
    .upsert(
      {
        boutique_id: input.boutiqueId,
        owner_user_id: input.ownerUserId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        user_agent: input.userAgent?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function listOwnerPushSubscriptionsByBoutique(
  boutiqueId: string,
): Promise<TrOwnerPushSubscription[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_owner_push_subscriptions")
    .select("*")
    .eq("boutique_id", boutiqueId);

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function deleteOwnerPushSubscriptionByEndpoint(
  endpoint: string,
): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("tr_owner_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) throw error;
}

export async function deleteOwnerPushSubscriptionForOwner(input: {
  boutiqueId: string;
  ownerUserId: string;
  endpoint: string;
}): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase
    .from("tr_owner_push_subscriptions")
    .delete()
    .eq("boutique_id", input.boutiqueId)
    .eq("owner_user_id", input.ownerUserId)
    .eq("endpoint", input.endpoint);

  if (error) throw error;
}
