import type { ClothingItem } from "@/types/item";
import type { Look } from "@/types/look";
import type { User } from "@supabase/supabase-js";

export interface WardrobeUser {
  id: string;
  email: string | null;
  displayLabel: string;
}

export interface WardrobeLook extends Look {
  unlocked: true;
}

export interface WardrobeClothingItem extends ClothingItem {
  sourceLookId: string;
}

export function mapSupabaseUser(user: User): WardrobeUser {
  const email = user.email ?? null;

  return {
    id: user.id,
    email,
    displayLabel: email
      ? (email.split("@")[0]?.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase() ??
        user.id.slice(0, 8).toUpperCase())
      : user.id.slice(0, 8).toUpperCase(),
  };
}
