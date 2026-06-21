import { getServiceSupabase } from "@/lib/supabaseAdmin";

export async function trackPurchaseIntent(
  lookId: string,
): Promise<{ ok: true } | { ok: false; code: "config" | "error" }> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { ok: false, code: "config" };
  }

  const { error: eventError } = await supabase
    .from("purchase_intent_events")
    .insert({ look_id: lookId });

  if (eventError) {
    console.error("purchase_intent_events insert failed:", eventError.message);
    return { ok: false, code: "error" };
  }

  const { data: existing } = await supabase
    .from("purchase_intent_stats")
    .select("click_count")
    .eq("look_id", lookId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("purchase_intent_stats")
      .update({
        click_count: Number(existing.click_count) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("look_id", lookId);

    if (updateError) {
      console.error("purchase_intent_stats update failed:", updateError.message);
    }
  } else {
    const { error: insertError } = await supabase
      .from("purchase_intent_stats")
      .insert({ look_id: lookId, click_count: 1 });

    if (insertError) {
      console.error("purchase_intent_stats insert failed:", insertError.message);
    }
  }

  return { ok: true };
}
