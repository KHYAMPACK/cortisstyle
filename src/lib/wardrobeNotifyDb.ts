import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidNotifyEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

export async function insertWardrobeNotifySignup(
  email: string,
  source = "wardrobe-coming-soon",
): Promise<{ ok: true } | { ok: false; code: "config" | "duplicate" | "error" }> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { ok: false, code: "config" };
  }

  const normalized = email.trim().toLowerCase();

  const { error } = await supabase.from("wardrobe_notify_signups").insert({
    email: normalized,
    source,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, code: "duplicate" };
    }
    console.error("wardrobe notify insert failed:", error.message);
    return { ok: false, code: "error" };
  }

  return { ok: true };
}
