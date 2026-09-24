import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  hasTypeNamed,
  planValueChanges,
  presetsToTypeInputs,
  VARIANT_TYPE_LIMITS,
} from "@/lib/tr/variants/typeRules";
import {
  mapVariantTypeRow,
  mapVariantValueRow,
  type TrVariantPresetImport,
  type TrVariantType,
  type TrVariantTypeInput,
  type TrVariantTypeListEntry,
  type TrVariantTypeValue,
} from "@/lib/tr/variants/types";
import { readProductColors } from "@/lib/tr/catalog/mappers";

/**
 * A boutique's variant types (Renk, Beden…) and their values. Server only, through
 * the service role. Reads are tolerant (before `patch_variant_types.sql` there are
 * simply no types); writes report a missing schema instead of failing silently.
 */

type DbError = { code?: string; message?: string };

function isSchemaMissing(error: DbError): boolean {
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return true;
  }
  return /does not exist|schema cache|could not find/i.test(error.message ?? "");
}

function isUniqueViolation(error: DbError): boolean {
  return error.code === "23505";
}

const SCHEMA_HINT =
  "Varyant türleri kullanılamıyor: veritabanı güncellemesi (patch_variant_types.sql) henüz uygulanmamış.";

export class VariantTypeError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "VariantTypeError";
  }
}

function client() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

/** Turns a database failure into what the owner should see. */
function failure(error: DbError, name?: string): never {
  if (isSchemaMissing(error)) throw new VariantTypeError(SCHEMA_HINT);
  if (isUniqueViolation(error)) {
    throw new VariantTypeError(
      name
        ? `“${name}” adında bir varyant türü zaten var.`
        : "Bu ad başka bir varyant türünde veya değerde kullanılıyor.",
      409,
    );
  }
  throw error;
}

// ---------------------------------------------------------------- reads

async function loadValues(typeIds: string[]): Promise<Map<string, TrVariantTypeValue[]>> {
  const byType = new Map<string, TrVariantTypeValue[]>();
  if (typeIds.length === 0) return byType;
  const { data, error } = await client()
    .from("tr_variant_type_values")
    .select("*")
    .in("type_id", typeIds);
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return byType;
  }
  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const typeId = String(record.type_id);
    const list = byType.get(typeId) ?? [];
    list.push(mapVariantValueRow(record));
    byType.set(typeId, list);
  }
  return byType;
}

/** Every type of a boutique with its values, in display order. */
export async function listVariantTypes(boutiqueId: string): Promise<TrVariantType[]> {
  const { data, error } = await client()
    .from("tr_variant_types")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return [];
  }
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const values = await loadValues(rows.map((row) => String(row.id)));
  return rows.map((row) => mapVariantTypeRow(row, values.get(String(row.id)) ?? []));
}

/**
 * How many products use each type. Gelişmiş products (`tr_product_options`) do not
 * exist yet, so this is 0 until they do; a missing table counts as 0 too.
 */
async function countProductsByType(typeIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (typeIds.length === 0) return counts;
  const { data, error } = await client()
    .from("tr_product_options")
    .select("type_id")
    .in("type_id", typeIds);
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return counts;
  }
  for (const row of data ?? []) {
    const id = String(row.type_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** The panel's list: each type with how many products use it. */
export async function listVariantTypeEntries(
  boutiqueId: string,
): Promise<TrVariantTypeListEntry[]> {
  const types = await listVariantTypes(boutiqueId);
  const counts = await countProductsByType(types.map((type) => type.id));
  return types.map((type) => ({ ...type, productCount: counts.get(type.id) ?? 0 }));
}

export async function getVariantType(id: string): Promise<TrVariantType | null> {
  const { data, error } = await client()
    .from("tr_variant_types")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return null;
  }
  if (!data) return null;
  const values = await loadValues([id]);
  return mapVariantTypeRow(data as Record<string, unknown>, values.get(id) ?? []);
}

// --------------------------------------------------------------- writes

async function insertValues(
  typeId: string,
  entries: Array<{ label: string; hex?: string | null; imageUrl?: string | null; sortOrder: number }>,
): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await client()
    .from("tr_variant_type_values")
    .insert(
      entries.map((entry) => ({
        type_id: typeId,
        label: entry.label,
        hex: entry.hex ?? null,
        image_url: entry.imageUrl ?? null,
        sort_order: entry.sortOrder,
      })),
    );
  if (error) failure(error);
}

export async function createVariantType(
  boutiqueId: string,
  input: TrVariantTypeInput,
): Promise<TrVariantType> {
  const existing = await listVariantTypes(boutiqueId);
  if (existing.length >= VARIANT_TYPE_LIMITS.typesMax) {
    throw new VariantTypeError(
      `En fazla ${VARIANT_TYPE_LIMITS.typesMax} varyant türü ekleyebilirsiniz.`,
    );
  }
  if (hasTypeNamed(existing, input.name)) {
    throw new VariantTypeError(
      `“${input.name}” adında bir varyant türü zaten var.`,
      409,
    );
  }

  const nextOrder = existing.reduce((max, type) => Math.max(max, type.sortOrder), -1) + 1;
  const { data, error } = await client()
    .from("tr_variant_types")
    .insert({
      boutique_id: boutiqueId,
      name: input.name,
      selection_style: input.selectionStyle,
      sort_order: nextOrder,
    })
    .select("*")
    .single();
  if (error) failure(error, input.name);

  const created = data as Record<string, unknown>;
  const typeId = String(created.id);
  try {
    await insertValues(
      typeId,
      input.values.map((value, sortOrder) => ({ ...value, sortOrder })),
    );
  } catch (valuesError) {
    // No transaction across the two inserts: don't leave an empty type behind.
    await client().from("tr_variant_types").delete().eq("id", typeId);
    throw valuesError;
  }
  return (await getVariantType(typeId))!;
}

export async function updateVariantType(
  id: string,
  input: TrVariantTypeInput,
): Promise<TrVariantType> {
  const current = await getVariantType(id);
  if (!current) throw new VariantTypeError("Varyant türü bulunamadı.", 404);

  const siblings = (await listVariantTypes(current.boutiqueId)).filter(
    (type) => type.id !== id,
  );
  if (hasTypeNamed(siblings, input.name)) {
    throw new VariantTypeError(
      `“${input.name}” adında bir varyant türü zaten var.`,
      409,
    );
  }

  const supabase = client();
  const { error: typeError } = await supabase
    .from("tr_variant_types")
    .update({
      name: input.name,
      selection_style: input.selectionStyle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (typeError) failure(typeError, input.name);

  // Values keep their ids across a rename (variants will reference them). Removals
  // first, then updates, then new values, so a label freed by one step can be taken by
  // the next.
  // TODO(M7b): refuse to remove a value, or the type, while a variant uses it.
  const plan = planValueChanges(current.values, input.values);
  if (plan.remove.length > 0) {
    const { error } = await supabase
      .from("tr_variant_type_values")
      .delete()
      .in("id", plan.remove);
    if (error) failure(error);
  }

  const renamed = plan.update.filter(({ id: valueId, input: value }) => {
    const stored = current.values.find((entry) => entry.id === valueId);
    return stored?.label !== value.label;
  });
  if (plan.needsTwoPhase) {
    // Park renamed values on temporary labels so swaps do not collide (within the
    // 40-character label limit).
    for (const { id: valueId } of renamed) {
      const { error } = await supabase
        .from("tr_variant_type_values")
        .update({ label: `__t${valueId.replaceAll("-", "").slice(0, 20)}` })
        .eq("id", valueId);
      if (error) failure(error);
    }
  }
  for (const { id: valueId, input: value, sortOrder } of plan.update) {
    const { error } = await supabase
      .from("tr_variant_type_values")
      .update({
        label: value.label,
        hex: value.hex ?? null,
        image_url: value.imageUrl ?? null,
        sort_order: sortOrder,
      })
      .eq("id", valueId);
    if (error) failure(error);
  }
  await insertValues(
    id,
    plan.insert.map(({ input: value, sortOrder }) => ({ ...value, sortOrder })),
  );

  return (await getVariantType(id))!;
}

/** Deletes the type and, by cascade, its values. */
export async function deleteVariantType(id: string): Promise<void> {
  // TODO(M7b): refuse while a product uses the type.
  const { error } = await client().from("tr_variant_types").delete().eq("id", id);
  if (error) failure(error);
}

// ------------------------------------------------------- preset import

/** The boutique's saved size / colour presets that are not yet a Beden / Renk type. */
async function importablePresets(boutiqueId: string) {
  const { data, error } = await client()
    .from("tr_boutiques")
    .select("size_presets, color_presets")
    .eq("id", boutiqueId)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return { beden: null, renk: null };
  }
  const sizes = Array.isArray(data?.size_presets)
    ? data.size_presets.filter((entry): entry is string => typeof entry === "string")
    : [];
  const { beden, renk } = presetsToTypeInputs(
    sizes,
    readProductColors(data?.color_presets),
  );

  const existing = await listVariantTypes(boutiqueId);
  return {
    beden: beden && !hasTypeNamed(existing, beden.name) ? beden : null,
    renk: renk && !hasTypeNamed(existing, renk.name) ? renk : null,
  };
}

/** How many sizes / colours could be imported (0 = nothing to offer). */
export async function getPresetImportInfo(
  boutiqueId: string,
): Promise<TrVariantPresetImport> {
  const { beden, renk } = await importablePresets(boutiqueId);
  return { sizes: beden?.values.length ?? 0, colors: renk?.values.length ?? 0 };
}

/** Creates Beden and / or Renk from the boutique's saved presets; returns what it made. */
export async function importPresetTypes(boutiqueId: string): Promise<TrVariantType[]> {
  const { beden, renk } = await importablePresets(boutiqueId);
  const created: TrVariantType[] = [];
  for (const input of [beden, renk]) {
    if (input) created.push(await createVariantType(boutiqueId, input));
  }
  if (created.length === 0) {
    throw new VariantTypeError("İçe aktarılacak beden veya renk bulunamadı.");
  }
  return created;
}
