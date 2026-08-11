import { getSupabaseClient } from "@/lib/supabaseClient";

export async function ensureUserProfile(userId: string, email?: string | null) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}
