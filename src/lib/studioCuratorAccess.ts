import type { User } from "@supabase/supabase-js";
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

async function isOnCuratorRoster(user: User): Promise<boolean> {
  const admin = getServiceSupabase();
  if (!admin) return false;

  const { data, error } = await admin
    .from("studio_curators")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[studio-curator] roster lookup failed:", error);
    return false;
  }

  return Boolean(data);
}

/** True when the user may use Lookbook Studio (env allowlist OR studio_curators row). */
export async function isStudioCurator(user: User): Promise<boolean> {
  if (isOnEmailAllowlist(user)) return true;
  return isOnCuratorRoster(user);
}

export const STUDIO_ACCESS_DENIED_MESSAGE =
  "Your account is not on the curator roster for Lookbook Studio.";
