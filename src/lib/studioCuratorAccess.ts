import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabaseAdmin";

function parseCuratorEmailAllowlist(): Set<string> {
  const raw = process.env.STUDIO_CURATOR_EMAILS?.trim();
  if (!raw) return new Set();

  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isOnEmailAllowlist(user: User): boolean {
  const allowlist = parseCuratorEmailAllowlist();
  if (allowlist.size === 0) return false;

  const email = user.email?.trim().toLowerCase();
  return Boolean(email && allowlist.has(email));
}

async function isOnCuratorRosterForUser(
  userSupabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await userSupabase
    .from("studio_curators")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[studio-curator] roster lookup failed:", error);
    return false;
  }

  return Boolean(data);
}

async function isOnCuratorRosterViaServiceRole(userId: string): Promise<boolean> {
  const admin = getServiceSupabase();
  if (!admin) return false;

  const { data, error } = await admin
    .from("studio_curators")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[studio-curator] service roster lookup failed:", error);
    return false;
  }

  return Boolean(data);
}

/**
 * Curator if env allowlist OR a `studio_curators` row exists for this auth user.
 * Prefer the user's JWT + RLS (works without service role on Vercel).
 */
export async function isStudioCurator(
  user: User,
  userSupabase?: SupabaseClient,
): Promise<boolean> {
  if (isOnEmailAllowlist(user)) return true;

  if (userSupabase) {
    const onRoster = await isOnCuratorRosterForUser(userSupabase, user.id);
    if (onRoster) return true;
  }

  return isOnCuratorRosterViaServiceRole(user.id);
}

export const STUDIO_ACCESS_DENIED_MESSAGE =
  "Your account is not on the curator roster for Lookbook Studio.";
