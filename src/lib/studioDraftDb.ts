import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeDraftPayload,
  type StudioDraftPayload,
  type StudioDraftRecord,
  type StudioDraftSummary,
} from "@/types/studioDraft";

interface DraftRow {
  id: string;
  user_id: string;
  look_id: string;
  title: string | null;
  payload: unknown;
  created_at: string;
  updated_at: string;
}

function mapDraftRow(row: DraftRow): StudioDraftRecord | null {
  const payload = normalizeDraftPayload(row.payload);
  if (!payload) return null;

  return {
    id: row.id,
    userId: row.user_id,
    lookId: row.look_id,
    title: row.title,
    payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStudioDraftsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<StudioDraftSummary[]> {
  const { data, error } = await supabase
    .from("studio_drafts")
    .select("id, look_id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    lookId: row.look_id as string,
    title: (row.title as string | null) ?? null,
    updatedAt: row.updated_at as string,
  }));
}

export async function getStudioDraftForUser(
  supabase: SupabaseClient,
  userId: string,
  draftId: string,
): Promise<StudioDraftRecord | null> {
  const { data, error } = await supabase
    .from("studio_drafts")
    .select("*")
    .eq("id", draftId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapDraftRow(data as DraftRow);
}

export async function createStudioDraft(
  supabase: SupabaseClient,
  userId: string,
  payload: StudioDraftPayload,
  title?: string | null,
): Promise<StudioDraftRecord> {
  const { data, error } = await supabase
    .from("studio_drafts")
    .insert({
      user_id: userId,
      look_id: payload.lookId,
      title: title?.trim() || payload.lookParams.lookTitle || null,
      payload,
    })
    .select("*")
    .single();

  if (error) throw error;

  const mapped = mapDraftRow(data as DraftRow);
  if (!mapped) {
    throw new Error("Draft payload failed validation after insert.");
  }

  return mapped;
}

export async function updateStudioDraft(
  supabase: SupabaseClient,
  userId: string,
  draftId: string,
  payload: StudioDraftPayload,
  title?: string | null,
): Promise<StudioDraftRecord | null> {
  const { data, error } = await supabase
    .from("studio_drafts")
    .update({
      look_id: payload.lookId,
      title: title?.trim() || payload.lookParams.lookTitle || null,
      payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapDraftRow(data as DraftRow);
}
