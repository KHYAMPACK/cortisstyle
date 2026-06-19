import { getClothingItem } from "@/data/items";
import { looks } from "@/data/looks";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { WardrobeClothingItem, WardrobeLook } from "@/types/user";

export interface UserWardrobeRow {
  id: string;
  user_id: string;
  look_id: string;
  unlocked_at: string;
}

export function resolvePurchasedLooks(lookIds: string[]): WardrobeLook[] {
  return lookIds
    .map((lookId) => looks.find((look) => look.id === lookId))
    .filter((look): look is WardrobeLook => Boolean(look))
    .map((look) => ({ ...look, unlocked: true as const }));
}

export function resolveOwnedClothesFromLooks(
  purchasedLookIds: string[],
): WardrobeClothingItem[] {
  const items = new Map<string, WardrobeClothingItem>();

  for (const lookId of purchasedLookIds) {
    const look = looks.find((entry) => entry.id === lookId);
    if (!look) continue;

    for (const placement of look.items) {
      const item = getClothingItem(placement.itemId);
      if (!item?.canvasImage || items.has(item.id)) continue;

      items.set(item.id, { ...item, sourceLookId: lookId });
    }
  }

  return Array.from(items.values());
}

export async function fetchUserWardrobeLookIds(
  userId: string,
): Promise<string[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("user_wardrobe")
    .select("look_id")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.look_id as string);
}

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

export function formatUserDisplayLabel(
  email?: string | null,
  userId?: string,
): string {
  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) {
      return localPart.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
    }
  }

  return userId ? userId.slice(0, 8).toUpperCase() : "USER";
}
