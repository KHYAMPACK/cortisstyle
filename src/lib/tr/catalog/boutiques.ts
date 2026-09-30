import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { getPublicCatalogSupabase } from "@/lib/supabase/supabaseServer";
import { mapBoutiqueRow, toPublicBoutique } from "@/lib/tr/mappers";
import type {
  CreateTrBoutiqueInput,
  TrBoutique,
  TrBoutiquePublic,
  TrBoutiqueStatus,
} from "@/types/tr-marketplace";

export const PUBLIC_BOUTIQUE_COLUMNS =
  "id, slug, name, legal_name, description, logo_url, whatsapp_phone, instagram_handle, theme_accent, shipping_note, exchange_policy, physical_address, custom_domain, editorial_content, catalog_profile, vergi_no, contact_email, status, created_at, updated_at, shipping_fee_kurus, free_shipping_min_items, free_shipping_min_subtotal_kurus";

/** Prefer this view once `patch_tr_boutiques_public_view.sql` is applied (anon-safe). */
export const PUBLIC_BOUTIQUE_VIEW = "tr_boutiques_public";

function boutiqueInsertRow(input: CreateTrBoutiqueInput) {
  return {
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    legal_name: input.legalName?.trim() ?? null,
    description: input.description?.trim() ?? null,
    logo_url: input.logoUrl?.trim() ?? null,
    whatsapp_phone: input.whatsappPhone?.trim() ?? null,
    instagram_handle: input.instagramHandle?.trim() ?? null,
    theme_accent: input.themeAccent?.trim() ?? null,
    shipping_note: input.shippingNote?.trim() ?? null,
    exchange_policy: input.exchangePolicy?.trim() ?? null,
    physical_address: input.physicalAddress?.trim() ?? null,
    custom_domain: input.customDomain?.trim().toLowerCase() || null,
    editorial_content: input.editorialContent ?? null,
    catalog_profile:
      input.catalogProfile === "custom_art" ? "custom_art" : "fashion",
    vergi_no: input.vergiNo?.trim() ?? null,
    iban: input.iban?.trim() ?? null,
    commission_bps: input.commissionBps ?? 1000,
    shipping_fee_kurus: input.shippingFeeKurus ?? 0,
    free_shipping_min_items: input.freeShippingMinItems ?? null,
    free_shipping_min_subtotal_kurus: input.freeShippingMinSubtotalKurus ?? null,
    contact_name: input.contactName?.trim() ?? null,
    contact_phone: input.contactPhone?.trim() ?? null,
    contact_email: input.contactEmail?.trim() ?? null,
    shipping_address: input.shippingAddress?.trim() ?? null,
    return_address: input.returnAddress?.trim() ?? null,
    status: input.status ?? "draft",
  };
}

export async function listPublicBoutiques(
  client?: SupabaseClient,
): Promise<TrBoutiquePublic[]> {
  // Prefer anon against tr_boutiques_public — a bad service-role key must not
  // take down storefronts (view is granted to anon/authenticated).
  const supabase = getPublicCatalogSupabase(client);
  const { data, error } = await supabase
    .from(PUBLIC_BOUTIQUE_VIEW)
    .select(PUBLIC_BOUTIQUE_COLUMNS)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) =>
    toPublicBoutique(mapBoutiqueRow(row as Record<string, unknown>)),
  );
}

export async function getPublicBoutiqueBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<TrBoutiquePublic | null> {
  const supabase = getPublicCatalogSupabase(client);
  const { data, error } = await supabase
    .from(PUBLIC_BOUTIQUE_VIEW)
    .select(PUBLIC_BOUTIQUE_COLUMNS)
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toPublicBoutique(mapBoutiqueRow(data as Record<string, unknown>));
}

export async function getPublicBoutiqueById(
  id: string,
  client?: SupabaseClient,
): Promise<TrBoutiquePublic | null> {
  const supabase = getPublicCatalogSupabase(client);
  const { data, error } = await supabase
    .from(PUBLIC_BOUTIQUE_VIEW)
    .select(PUBLIC_BOUTIQUE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toPublicBoutique(mapBoutiqueRow(data as Record<string, unknown>));
}

export async function listAllBoutiquesAdmin(): Promise<TrBoutique[]> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_boutiques")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapBoutiqueRow(row as Record<string, unknown>));
}

export async function getBoutiqueBySlugAdmin(
  slug: string,
): Promise<TrBoutique | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_boutiques")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapBoutiqueRow(data as Record<string, unknown>);
}

export async function getBoutiqueByIdAdmin(id: string): Promise<TrBoutique | null> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_boutiques")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapBoutiqueRow(data as Record<string, unknown>);
}

export async function createBoutiqueAdmin(
  input: CreateTrBoutiqueInput,
): Promise<TrBoutique> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_boutiques")
    .insert(boutiqueInsertRow(input))
    .select("*")
    .single();

  if (error) throw error;

  return mapBoutiqueRow(data as Record<string, unknown>);
}

export async function updateBoutiqueStatusAdmin(
  id: string,
  status: TrBoutiqueStatus,
): Promise<TrBoutique> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_boutiques")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return mapBoutiqueRow(data as Record<string, unknown>);
}

export async function setBoutiqueOwnerAdmin(
  boutiqueId: string,
  ownerUserId: string | null,
): Promise<TrBoutique> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await supabase
    .from("tr_boutiques")
    .update({ owner_user_id: ownerUserId })
    .eq("id", boutiqueId)
    .select("*")
    .single();

  if (error) throw error;

  return mapBoutiqueRow(data as Record<string, unknown>);
}

export interface UpdateTrBoutiqueBrandInput {
  description?: string | null;
  logoUrl?: string | null;
  whatsappPhone?: string | null;
  instagramHandle?: string | null;
  shippingNote?: string | null;
  exchangePolicy?: string | null;
  physicalAddress?: string | null;
  themeAccent?: string | null;
  customDomain?: string | null;
  editorialContent?: Record<string, unknown> | null;
  catalogProfile?: "fashion" | "custom_art";
  /** Shipping fee rules — validate with validateShippingSettings() first. */
  shippingFeeKurus?: number;
  freeShippingMinItems?: number | null;
  freeShippingMinSubtotalKurus?: number | null;
  /** Seller legal — owner panel only; not on public boutique. */
  legalName?: string | null;
  vergiNo?: string | null;
  iban?: string | null;
  contactEmail?: string | null;
}

export async function updateBoutiqueBrandAdmin(
  boutiqueId: string,
  input: UpdateTrBoutiqueBrandInput,
): Promise<TrBoutique> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const row: Record<string, unknown> = {};
  if (input.description !== undefined) {
    row.description = input.description?.trim() ?? null;
  }
  if (input.logoUrl !== undefined) {
    row.logo_url = input.logoUrl?.trim() ?? null;
  }
  if (input.whatsappPhone !== undefined) {
    row.whatsapp_phone = input.whatsappPhone?.trim() ?? null;
  }
  if (input.instagramHandle !== undefined) {
    row.instagram_handle = input.instagramHandle?.trim() ?? null;
  }
  if (input.shippingNote !== undefined) {
    row.shipping_note = input.shippingNote?.trim() ?? null;
  }
  if (input.exchangePolicy !== undefined) {
    row.exchange_policy = input.exchangePolicy?.trim() ?? null;
  }
  if (input.physicalAddress !== undefined) {
    row.physical_address = input.physicalAddress?.trim() ?? null;
  }
  if (input.themeAccent !== undefined) {
    row.theme_accent = input.themeAccent?.trim() ?? null;
  }
  if (input.customDomain !== undefined) {
    row.custom_domain = input.customDomain?.trim().toLowerCase() || null;
  }
  if (input.shippingFeeKurus !== undefined) {
    row.shipping_fee_kurus = input.shippingFeeKurus;
  }
  if (input.freeShippingMinItems !== undefined) {
    row.free_shipping_min_items = input.freeShippingMinItems;
  }
  if (input.freeShippingMinSubtotalKurus !== undefined) {
    row.free_shipping_min_subtotal_kurus = input.freeShippingMinSubtotalKurus;
  }
  if (input.editorialContent !== undefined) {
    row.editorial_content = input.editorialContent;
  }
  if (input.catalogProfile !== undefined) {
    row.catalog_profile =
      input.catalogProfile === "custom_art" ? "custom_art" : "fashion";
  }
  if (input.legalName !== undefined) {
    row.legal_name = input.legalName?.trim() || null;
  }
  if (input.vergiNo !== undefined) {
    row.vergi_no = input.vergiNo?.replace(/\s/g, "").trim() || null;
  }
  if (input.iban !== undefined) {
    row.iban = input.iban?.replace(/\s/g, "").toUpperCase().trim() || null;
  }
  if (input.contactEmail !== undefined) {
    row.contact_email = input.contactEmail?.trim().toLowerCase() || null;
  }

  if (Object.keys(row).length === 0) {
    const existing = await getBoutiqueByIdAdmin(boutiqueId);
    if (!existing) throw new Error("Boutique not found.");
    return existing;
  }

  const { data, error } = await supabase
    .from("tr_boutiques")
    .update(row)
    .eq("id", boutiqueId)
    .select("*")
    .single();

  if (error) throw error;

  return mapBoutiqueRow(data as Record<string, unknown>);
}

