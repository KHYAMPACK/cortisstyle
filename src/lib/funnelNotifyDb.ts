import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase, isValidNotifyEmail } from "@/lib/supabaseAdmin";

export type FunnelNotifySource =
  | "wardrobe-coming-soon"
  | "archive-extension"
  | "checkout-priority"
  | "member-notify"
  | "premium-inner-circle";

export { isValidNotifyEmail };

type InsertResult =
  | { ok: true }
  | { ok: false; code: "config" | "duplicate" | "error" };

async function insertMemberNotifySignup(
  supabase: SupabaseClient,
  input: {
    email: string;
    source: FunnelNotifySource;
    lookId?: string;
  },
): Promise<InsertResult> {
  const row: {
    email: string;
    source: string;
    look_id?: string | null;
  } = {
    email: input.email,
    source: input.source,
  };

  if (input.lookId) {
    row.look_id = input.lookId;
  }

  const { error } = await supabase.from("member_notify_signups").insert(row);

  if (error) {
    if (error.code === "23505") return { ok: false, code: "duplicate" };
    console.error("member_notify_signups insert failed:", error.message);
    return { ok: false, code: "error" };
  }

  return { ok: true };
}

export async function insertFunnelNotifySignup(input: {
  email: string;
  source: FunnelNotifySource;
  lookId?: string;
}): Promise<InsertResult> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { ok: false, code: "config" };
  }

  const normalized = input.email.trim().toLowerCase();

  if (input.source === "wardrobe-coming-soon") {
    const { error } = await supabase.from("wardrobe_notify_signups").insert({
      email: normalized,
      source: input.source,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, code: "duplicate" };
      console.error("wardrobe_notify_signups insert failed:", error.message);
      return { ok: false, code: "error" };
    }
    return { ok: true };
  }

  if (
    input.source === "archive-extension" ||
    input.source === "member-notify" ||
    input.source === "checkout-priority" ||
    input.source === "premium-inner-circle"
  ) {
    return insertMemberNotifySignup(supabase, {
      email: normalized,
      source: input.source,
      lookId: input.lookId,
    });
  }

  return { ok: false, code: "error" };
}
