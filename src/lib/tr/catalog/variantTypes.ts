import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { updateProductAdmin } from "@/lib/tr/catalog/products";
import { readSizeStocks } from "@/lib/tr/sizeStocks";
import {
  renameProductSizes,
  sizeRenameOffers,
  sizeRenamesFromUpdate,
  type SizeRename,
  type SizeRenameOffer,
} from "@/lib/tr/variants/sizeRenames";
import {
  hasTypeNamed,
  importableSizeTypeInputs,
  planValueChanges,
  VARIANT_TYPE_LIMITS,
} from "@/lib/tr/variants/typeRules";
import {
  mapVariantTypeRow,
  mapVariantValueRow,
  type TrVariantType,
  type TrVariantTypeImportOffer,
  type TrVariantTypeInput,
  type TrVariantTypeListEntry,
  type TrVariantTypeValue,
} from "@/lib/tr/variants/types";

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

const ROLE_SCHEMA_HINT =
  "Beden / renk türü kaydedilemedi: veritabanı güncellemesi (patch_variant_type_roles.sql) henüz uygulanmamış.";

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
  if (isSchemaMissing(error)) {
    throw new VariantTypeError(
      /\brole\b/.test(error.message ?? "") ? ROLE_SCHEMA_HINT : SCHEMA_HINT,
    );
  }
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
 * How many products use each type (`tr_product_options`). A missing table counts as 0.
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

/**
 * For each of the given values, how many products have a variant that uses it. A value
 * that is in use cannot be removed: its variants would lose a part of their combination.
 */
async function countProductsByValue(valueIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (valueIds.length === 0) return counts;
  const { data, error } = await client()
    .from("tr_product_variants")
    .select("product_id, option_value_ids")
    .overlaps("option_value_ids", valueIds);
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return counts;
  }
  const wanted = new Set(valueIds);
  const productsByValue = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    for (const valueId of (row.option_value_ids ?? []) as string[]) {
      if (!wanted.has(valueId)) continue;
      const products = productsByValue.get(valueId) ?? new Set<string>();
      products.add(String(row.product_id));
      productsByValue.set(valueId, products);
    }
  }
  for (const [valueId, products] of productsByValue) counts.set(valueId, products.size);
  return counts;
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
      // Only sent when set, so a database without the role patch still takes plain types.
      ...(input.role ? { role: input.role } : {}),
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

/**
 * Saves the type. For a Beden type, also reports the renamed sizes that the boutique's
 * products still carry, so the panel can offer to rename them there too.
 */
export async function updateVariantType(
  id: string,
  input: TrVariantTypeInput,
): Promise<{ type: TrVariantType; sizeRenames: SizeRenameOffer[] }> {
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

  // Values keep their ids across a rename (variants reference them). A value that
  // variants use cannot be removed, so check before anything is written.
  const plan = planValueChanges(current.values, input.values);
  const usage = await countProductsByValue(plan.remove);
  for (const valueId of plan.remove) {
    const products = usage.get(valueId);
    if (products) {
      const label = current.values.find((value) => value.id === valueId)?.label ?? "";
      throw new VariantTypeError(
        `“${label}” değeri ${products} üründe kullanılıyor; kaldırılamaz.`,
        409,
      );
    }
  }

  const supabase = client();
  const { error: typeError } = await supabase
    .from("tr_variant_types")
    .update({
      name: input.name,
      selection_style: input.selectionStyle,
      // Only sent when it changes, so a database without the role patch still saves.
      ...(input.role !== current.role ? { role: input.role } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (typeError) failure(typeError, input.name);

  // Removals first, then updates, then new values, so a label freed by one step can
  // be taken by the next.
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

  const type = (await getVariantType(id))!;
  const renames =
    current.role === "size" || input.role === "size"
      ? sizeRenamesFromUpdate(current.values, input.values)
      : [];
  const sizeRenames =
    renames.length > 0
      ? sizeRenameOffers(renames, await listProductSizes(current.boutiqueId))
      : [];
  return { type, sizeRenames };
}

// ------------------------------------------------------ renaming sizes on products

async function listProductSizes(boutiqueId: string) {
  const { data, error } = await client()
    .from("tr_products")
    .select("id, sizes, size_stocks, stock")
    .eq("boutique_id", boutiqueId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    sizes: Array.isArray(row.sizes)
      ? row.sizes.filter((size): size is string => typeof size === "string")
      : [],
    sizeStocks: readSizeStocks(row.size_stocks),
    stock: typeof row.stock === "number" ? row.stock : 0,
  }));
}

/**
 * Renames sizes on the boutique's products after the owner renamed them in a Beden
 * type ("offer to update", Mert 2026-09-30). Every new label must be a value of the
 * type. A product's total stock doesn't change. Returns how many products changed.
 */
export async function renameSizesOnProducts(
  typeId: string,
  renames: readonly SizeRename[],
): Promise<number> {
  const type = await getVariantType(typeId);
  if (!type) throw new VariantTypeError("Varyant türü bulunamadı.", 404);
  if (type.role !== "size") {
    throw new VariantTypeError("Yalnızca beden türlerinin değerleri ürünlerde güncellenir.");
  }
  const labels = new Set(type.values.map((value) => value.label));
  for (const rename of renames) {
    if (!labels.has(rename.to)) {
      throw new VariantTypeError(`“${rename.to}” bu beden türünde yok.`);
    }
  }

  let updated = 0;
  for (const product of await listProductSizes(type.boutiqueId)) {
    const next = renameProductSizes(product.sizes, product.sizeStocks, renames);
    if (!next.changed) continue;
    await updateProductAdmin(product.id, {
      sizes: next.sizes,
      sizeStocks: next.sizeStocks,
      stock: product.stock,
    });
    updated += 1;
  }
  return updated;
}

/** Deletes the type and, by cascade, its values. */
export async function deleteVariantType(id: string): Promise<void> {
  const inUse = (await countProductsByType([id])).get(id) ?? 0;
  if (inUse > 0) {
    throw new VariantTypeError(
      `Bu varyant türü ${inUse} üründe kullanılıyor; silinemez.`,
      409,
    );
  }
  const { error } = await client().from("tr_variant_types").delete().eq("id", id);
  if (error) {
    // The foreign key on tr_product_options is the backstop for a race with the check.
    if (error.code === "23503") {
      throw new VariantTypeError("Bu varyant türü ürünlerde kullanılıyor; silinemez.", 409);
    }
    failure(error);
  }
}

// -------------------------------------------------- built-in size import

/** What "Hazır bedenleri içe aktar" would create for this boutique (nothing = no offer). */
export async function getImportOffer(boutiqueId: string): Promise<TrVariantTypeImportOffer> {
  const existing = await listVariantTypes(boutiqueId);
  return { sizeTypes: importableSizeTypeInputs(existing).map((input) => input.name) };
}

/** Creates the built-in size types (Beden, Pantolon bedeni); returns what it made. */
export async function importBuiltInSizeTypes(boutiqueId: string): Promise<TrVariantType[]> {
  const inputs = importableSizeTypeInputs(await listVariantTypes(boutiqueId));
  if (inputs.length === 0) {
    throw new VariantTypeError("İçe aktarılacak hazır beden bulunamadı.");
  }
  const created: TrVariantType[] = [];
  for (const input of inputs) created.push(await createVariantType(boutiqueId, input));
  return created;
}
