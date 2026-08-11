import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerServiceSupabase } from "@/lib/supabase/supabaseServer";

/** Service-role client (server only). Prefer for admin/owner writes. */
export function getServiceSupabase(): SupabaseClient | null {
  return getServerServiceSupabase();
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidNotifyEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}
