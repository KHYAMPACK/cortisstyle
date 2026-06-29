import { getClothingItem } from "@/data/items";
import { getLooks } from "@/data/looks";
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
    .map((lookId) => getLooks().find((look) => look.id === lookId))
    .filter((look): look is WardrobeLook => Boolean(look))
    .map((look) => ({ ...look, unlocked: true as const }));
}

export function resolveOwnedClothesFromLooks(
  purchasedLookIds: string[],
): WardrobeClothingItem[] {
  const items = new Map<string, WardrobeClothingItem>();

  for (const lookId of purchasedLookIds) {
    const look = getLooks().find((entry) => entry.id === lookId);
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Sign in to load your wardrobe archive.");
  }

  await ensureUserProfile(user.id, user.email);

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

export async function addLookToUserWardrobe(
  userId: string,
  lookId: string,
): Promise<{ alreadyOwned: boolean }> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Sign in to add looks to your wardrobe.");
  }

  if (user.id !== userId) {
    throw new Error("Session mismatch. Sign out and sign in again.");
  }

  await ensureUserProfile(user.id, user.email);

  const { data: existing, error: existingError } = await supabase
    .from("user_wardrobe")
    .select("id")
    .eq("user_id", userId)
    .eq("look_id", lookId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return { alreadyOwned: true };
  }

  const { error } = await supabase.from("user_wardrobe").insert({
    user_id: userId,
    look_id: lookId,
  });

  if (error) {
    throw error;
  }

  return { alreadyOwned: false };
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
