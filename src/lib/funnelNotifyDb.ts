import { getServiceSupabase, isValidNotifyEmail } from "@/lib/supabaseAdmin";

export type FunnelNotifySource =
  | "wardrobe-coming-soon"
  | "archive-extension"
  | "checkout-priority";

export { isValidNotifyEmail };

export async function insertFunnelNotifySignup(input: {
  email: string;
  source: FunnelNotifySource;
  lookId?: string;
}): Promise<{ ok: true } | { ok: false; code: "config" | "duplicate" | "error" }> {
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

  if (input.source === "archive-extension") {
    const { error } = await supabase.from("archive_stream_signups").insert({
      email: normalized,
      source: input.source,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, code: "duplicate" };
      console.error("archive_stream_signups insert failed:", error.message);
      return { ok: false, code: "error" };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("checkout_priority_signups").insert({
    email: normalized,
    look_id: input.lookId ?? null,
    source: input.source,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, code: "duplicate" };
    }
    console.error("checkout_priority_signups insert failed:", error.message);
    return { ok: false, code: "error" };
  }

  return { ok: true };
}
