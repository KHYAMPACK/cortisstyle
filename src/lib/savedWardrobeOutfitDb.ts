import { getSupabaseClient } from "@/lib/supabaseClient";
import { normalizeSavedOutfitBlueprint } from "@/lib/normalizeSavedOutfit";
import {
  createSavedOutfitBlueprint,
  loadSavedWardrobeOutfits,
  persistSavedWardrobeOutfit,
} from "@/lib/savedWardrobeOutfit";
import { ensureUserProfile } from "@/lib/wardrobe";
import type {
  LayoutPositionOverride,
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
  layout_overrides?: Record<string, LayoutPositionOverride> | null;
  saved_at: string;
}

export interface SaveWardrobeOutfitInput {
  name: string;
  moodword: string;
  moodImageUrl: string | null;
  slots: WardrobeOutfitMatrix;
  layoutOverrides?: Record<string, LayoutPositionOverride>;
}

export interface PersistSavedOutfitResult {
  blueprint: SavedWardrobeOutfitBlueprint;
  storedIn: "database" | "local";
  warning?: string;
}

const MAX_MOOD_IMAGE_URL_LENGTH = 400_000;

function mapRowToBlueprint(row: UserSavedOutfitRow): SavedWardrobeOutfitBlueprint {
  return normalizeSavedOutfitBlueprint({
    id: row.id,
    name: row.name,
    moodword: row.moodword ?? "",
    moodImageUrl: row.mood_image_url,
    slots: row.slots,
    layoutOverrides: row.layout_overrides ?? undefined,
    savedAt: row.saved_at,
  });
}

function isMissingMoodwordColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: string }).message ?? "");
  return message.includes("moodword") && message.includes("does not exist");
}

function isMissingLayoutOverridesColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: string }).message ?? "");
  return message.includes("layout_overrides") && message.includes("does not exist");
}

export function formatSupabaseError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to save outfit to your archive.";
  }

  const record = error as {
    message?: string;
    details?: string;
    hint?: string;
  };

  const parts = [record.message, record.details, record.hint].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" — ");
  }

  return "Unable to save outfit to your archive.";
}

function sanitizeMoodImageUrl(
  moodImageUrl: string | null,
): { url: string | null; dropped: boolean } {
  if (!moodImageUrl) {
    return { url: null, dropped: false };
  }

  if (moodImageUrl.length <= MAX_MOOD_IMAGE_URL_LENGTH) {
    return { url: moodImageUrl, dropped: false };
  }

  return { url: null, dropped: true };
}

function persistLocally(
  input: SaveWardrobeOutfitInput,
  moodImageUrl: string | null,
): SavedWardrobeOutfitBlueprint {
  const blueprint = createSavedOutfitBlueprint({
    name: input.name,
    moodword: input.moodword,
    moodImageUrl,
    slots: input.slots,
    ...(input.layoutOverrides ? { layoutOverrides: input.layoutOverrides } : {}),
  });

  persistSavedWardrobeOutfit(blueprint);
  return blueprint;
}

export async function fetchUserSavedOutfits(
  userId: string,
): Promise<SavedWardrobeOutfitBlueprint[]> {
  const supabase = getSupabaseClient();

  const fullSelect =
    "id, user_id, name, moodword, mood_image_url, slots, layout_overrides, saved_at";

  let { data, error } = await supabase
    .from("user_saved_outfits")
    .select(fullSelect)
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error && isMissingLayoutOverridesColumn(error)) {
    const fallback = await supabase
      .from("user_saved_outfits")
      .select("id, user_id, name, moodword, mood_image_url, slots, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    data =
      fallback.data?.map((row) => ({ ...row, layout_overrides: null })) ?? null;
    error = fallback.error;
  }

  if (error && isMissingMoodwordColumn(error)) {
    const fallback = await supabase
      .from("user_saved_outfits")
      .select("id, user_id, name, mood_image_url, slots, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    data =
      fallback.data?.map((row) => ({
        ...row,
        moodword: null,
        layout_overrides: null,
      })) ?? null;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToBlueprint(row as UserSavedOutfitRow));
}

export async function fetchAllSavedOutfitsForUser(
  userId: string,
): Promise<SavedWardrobeOutfitBlueprint[]> {
  let dbOutfits: SavedWardrobeOutfitBlueprint[] = [];

  try {
    dbOutfits = await fetchUserSavedOutfits(userId);
  } catch (error) {
    console.error("Failed to load saved outfits from database:", error);
  }

  const localOutfits = loadSavedWardrobeOutfits().map(normalizeSavedOutfitBlueprint);
  const merged = new Map<string, SavedWardrobeOutfitBlueprint>();

  for (const outfit of localOutfits) {
    merged.set(outfit.id, outfit);
  }

  for (const outfit of dbOutfits) {
    merged.set(outfit.id, outfit);
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

async function persistToDatabase(
  userId: string,
  input: SaveWardrobeOutfitInput,
  moodImageUrl: string | null,
): Promise<SavedWardrobeOutfitBlueprint> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Sign in to save outfits to your archive.");
  }

  if (user.id !== userId) {
    throw new Error("Session mismatch. Sign out and sign in again.");
  }

  await ensureUserProfile(user.id, user.email);

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    name: input.name,
    moodword: input.moodword || null,
    mood_image_url: moodImageUrl,
    slots: input.slots,
  };

  if (input.layoutOverrides && Object.keys(input.layoutOverrides).length > 0) {
    insertPayload.layout_overrides = input.layoutOverrides;
  }

  let { data, error } = await supabase
    .from("user_saved_outfits")
    .insert(insertPayload)
    .select(
      "id, user_id, name, moodword, mood_image_url, slots, layout_overrides, saved_at",
    )
    .single();

  if (error && isMissingLayoutOverridesColumn(error)) {
    const { layout_overrides: _dropped, ...legacyPayload } = insertPayload;
    const fallback = await supabase
      .from("user_saved_outfits")
      .insert(legacyPayload)
      .select("id, user_id, name, moodword, mood_image_url, slots, saved_at")
      .single();

    data = fallback.data
      ? { ...fallback.data, layout_overrides: null }
      : null;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  return mapRowToBlueprint(data as UserSavedOutfitRow);
}

export async function persistSavedWardrobeOutfitToDb(
  userId: string,
  input: SaveWardrobeOutfitInput,
): Promise<PersistSavedOutfitResult> {
  const { url: storedMoodImageUrl, dropped: moodImageDropped } =
    sanitizeMoodImageUrl(input.moodImageUrl);

  const payload: SaveWardrobeOutfitInput = {
    ...input,
    moodImageUrl: storedMoodImageUrl,
  };

  const moodImageWarning = moodImageDropped
    ? "Mood image was too large to store in the cloud archive and was omitted from the saved record."
    : undefined;

  try {
    const blueprint = await persistToDatabase(userId, payload, storedMoodImageUrl);

    return {
      blueprint: {
        ...blueprint,
        moodImageUrl: input.moodImageUrl ?? blueprint.moodImageUrl,
      },
      storedIn: "database",
      warning: moodImageWarning,
    };
  } catch (error) {
    console.error("Supabase outfit save failed:", error);

    const blueprint = persistLocally(
      payload,
      input.moodImageUrl ?? storedMoodImageUrl,
    );

    const dbMessage = formatSupabaseError(error);
    const isSchemaIssue =
      dbMessage.includes("user_saved_outfits") ||
      dbMessage.includes("moodword") ||
      dbMessage.includes("layout_overrides") ||
      dbMessage.includes("schema cache") ||
      dbMessage.includes("does not exist");

    return {
      blueprint,
      storedIn: "local",
      warning: isSchemaIssue
        ? `${dbMessage} Saved locally on this device. Run the latest supabase/schema.sql migration in your Supabase SQL editor to enable cloud sync.`
        : `${dbMessage} Saved locally on this device as a fallback.`,
    };
  }
}
