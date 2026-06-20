import { getSupabaseClient } from "@/lib/supabaseClient";
import type {
  SavedWardrobeOutfitBlueprint,
  WardrobeOutfitMatrix,
} from "@/types/wardrobe-builder";

export interface UserSavedOutfitRow {
  id: string;
  user_id: string;
  name: string;
  moodword: string | null;
  mood_image_url: string | null;
  slots: WardrobeOutfitMatrix;
  saved_at: string;
}

export interface SaveWardrobeOutfitInput {
  name: string;
  moodword: string;
  moodImageUrl: string | null;
  slots: WardrobeOutfitMatrix;
}

function mapRowToBlueprint(row: UserSavedOutfitRow): SavedWardrobeOutfitBlueprint {
  return {
    id: row.id,
    name: row.name,
    moodword: row.moodword ?? "",
    moodImageUrl: row.mood_image_url,
    slots: row.slots,
    savedAt: row.saved_at,
  };
}

export async function fetchUserSavedOutfits(
  userId: string,
): Promise<SavedWardrobeOutfitBlueprint[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("user_saved_outfits")
    .select("id, user_id, name, moodword, mood_image_url, slots, saved_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToBlueprint(row as UserSavedOutfitRow));
}

export async function persistSavedWardrobeOutfitToDb(
  userId: string,
  input: SaveWardrobeOutfitInput,
): Promise<SavedWardrobeOutfitBlueprint> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("user_saved_outfits")
    .insert({
      user_id: userId,
      name: input.name,
      moodword: input.moodword,
      mood_image_url: input.moodImageUrl,
      slots: input.slots,
    })
    .select("id, user_id, name, moodword, mood_image_url, slots, saved_at")
    .single();

  if (error) {
    throw error;
  }

  return mapRowToBlueprint(data as UserSavedOutfitRow);
}
