import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { listCategories } from "@/lib/tr/catalog/categories";
import { listVariantTypes } from "@/lib/tr/catalog/variantTypes";
import {
  attributeKeyFromLabel,
  hasNamed,
  narrowOptions,
  planKindAssignments,
  planKindImport,
  PRODUCT_KIND_LIMITS,
  resolveKindInput,
} from "@/lib/tr/productKinds/rules";
import {
  mapAttributeRow,
  mapKindAttributeRow,
  mapKindRow,
  type TrAttributeDefinition,
  type TrAttributeInputBody,
  type TrAttributeListEntry,
  type TrKindAttribute,
  type TrKindTemplate,
  type TrProductKind,
  type TrProductKindInput,
  type TrProductKindListEntry,
} from "@/lib/tr/productKinds/types";

/**
 * A boutique's product kinds and fields (`patch_product_kinds.sql`). Server only, through
 * the service role. Reads are tolerant (before the patch there are simply none); writes
 * report a missing schema instead of failing silently.
 */

type DbError = { code?: string; message?: string };

function isSchemaMissing(error: DbError): boolean {
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) return true;
  return /does not exist|schema cache|could not find/i.test(error.message ?? "");
}

const SCHEMA_HINT =
  "Ürün türleri kullanılamıyor: veritabanı güncellemesi (patch_product_kinds.sql) henüz uygulanmamış.";

export class ProductKindError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "ProductKindError";
  }
}

function client() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function failure(error: DbError, duplicate: string): never {
  if (isSchemaMissing(error)) throw new ProductKindError(SCHEMA_HINT);
  if (error.code === "23505") throw new ProductKindError(duplicate, 409);
  throw error;
}

// ---------------------------------------------------------------- fields

export async function listAttributes(boutiqueId: string): Promise<TrAttributeDefinition[]> {
  const { data, error } = await client()
    .from("tr_attribute_definitions")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return [];
  }
  return (data ?? []).map((row) => mapAttributeRow(row as Record<string, unknown>));
}

export async function getAttribute(id: string): Promise<TrAttributeDefinition | null> {
  const { data, error } = await client()
    .from("tr_attribute_definitions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return null;
  }
  return data ? mapAttributeRow(data as Record<string, unknown>) : null;
}

/** The Özellikler list: each field with how many kinds have it. */
export async function listAttributeEntries(boutiqueId: string): Promise<TrAttributeListEntry[]> {
  const [attributes, kinds] = await Promise.all([
    listAttributes(boutiqueId),
    listKinds(boutiqueId),
  ]);
  const counts = new Map<string, number>();
  for (const kind of kinds) {
    for (const link of kind.attributes) {
      counts.set(link.attributeId, (counts.get(link.attributeId) ?? 0) + 1);
    }
  }
  return attributes.map((attribute) => ({
    ...attribute,
    kindCount: counts.get(attribute.id) ?? 0,
  }));
}

function duplicateLabel(label: string): string {
  return `“${label}” adında bir özellik zaten var.`;
}

export async function createAttribute(
  boutiqueId: string,
  input: TrAttributeInputBody,
  key?: string,
): Promise<TrAttributeDefinition> {
  const existing = await listAttributes(boutiqueId);
  if (existing.length >= PRODUCT_KIND_LIMITS.attributesMax) {
    throw new ProductKindError(
      `En fazla ${PRODUCT_KIND_LIMITS.attributesMax} özellik ekleyebilirsiniz.`,
    );
  }
  if (hasNamed(existing, input.label, (row) => row.label)) {
    throw new ProductKindError(duplicateLabel(input.label), 409);
  }
  const nextOrder = existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
  const { data, error } = await client()
    .from("tr_attribute_definitions")
    .insert({
      boutique_id: boutiqueId,
      key: key ?? attributeKeyFromLabel(input.label, existing.map((row) => row.key)),
      label: input.label,
      input: input.input,
      options: input.options,
      allow_custom: input.allowCustom,
      sort_order: nextOrder,
    })
    .select("*")
    .single();
  if (error) failure(error, duplicateLabel(input.label));
  return mapAttributeRow(data as Record<string, unknown>);
}

/**
 * Saves a field (its key never changes: product values are stored under it). The kinds'
 * option subsets are narrowed to the options the field still has.
 */
export async function updateAttribute(
  id: string,
  input: TrAttributeInputBody,
): Promise<TrAttributeDefinition> {
  const current = await getAttribute(id);
  if (!current) throw new ProductKindError("Özellik bulunamadı.", 404);
  const siblings = await listAttributes(current.boutiqueId);
  if (hasNamed(siblings, input.label, (row) => row.label, id)) {
    throw new ProductKindError(duplicateLabel(input.label), 409);
  }
  const supabase = client();
  const { data, error } = await supabase
    .from("tr_attribute_definitions")
    .update({
      label: input.label,
      input: input.input,
      options: input.options,
      allow_custom: input.allowCustom,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) failure(error, duplicateLabel(input.label));
  const saved = mapAttributeRow(data as Record<string, unknown>);

  const { data: links, error: linksError } = await supabase
    .from("tr_product_kind_attributes")
    .select("*")
    .eq("attribute_id", id)
    .not("options", "is", null);
  if (linksError) failure(linksError, "");
  for (const row of links ?? []) {
    const link = mapKindAttributeRow(row as Record<string, unknown>);
    const narrowed = narrowOptions(saved, link.options);
    if (JSON.stringify(narrowed) === JSON.stringify(link.options)) continue;
    const { error: narrowError } = await supabase
      .from("tr_product_kind_attributes")
      .update({ options: narrowed })
      .eq("kind_id", link.kindId)
      .eq("attribute_id", id);
    if (narrowError) failure(narrowError, "");
  }
  return saved;
}

/** Deletes a field and removes it from every kind. Product values stay in `features`. */
export async function deleteAttribute(id: string): Promise<void> {
  const { error } = await client().from("tr_attribute_definitions").delete().eq("id", id);
  if (error) failure(error, "");
}

// ---------------------------------------------------------------- kinds

async function loadKindAttributes(kindIds: string[]): Promise<Map<string, TrKindAttribute[]>> {
  const byKind = new Map<string, TrKindAttribute[]>();
  if (kindIds.length === 0) return byKind;
  const { data, error } = await client()
    .from("tr_product_kind_attributes")
    .select("*")
    .in("kind_id", kindIds)
    .order("sort_order", { ascending: true });
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return byKind;
  }
  for (const row of data ?? []) {
    const { kindId, attributeId, required, options } = mapKindAttributeRow(
      row as Record<string, unknown>,
    );
    byKind.set(kindId, [...(byKind.get(kindId) ?? []), { attributeId, required, options }]);
  }
  return byKind;
}

export async function listKinds(boutiqueId: string): Promise<TrProductKind[]> {
  const { data, error } = await client()
    .from("tr_product_kinds")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return [];
  }
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const links = await loadKindAttributes(rows.map((row) => String(row.id)));
  return rows.map((row) => mapKindRow(row, links.get(String(row.id)) ?? []));
}

export async function getKind(id: string): Promise<TrProductKind | null> {
  const { data, error } = await client()
    .from("tr_product_kinds")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return null;
  }
  if (!data) return null;
  const links = await loadKindAttributes([id]);
  return mapKindRow(data as Record<string, unknown>, links.get(id) ?? []);
}

/**
 * Each of the boutique's products with its kind (`null` = none). Before the patch every
 * product has none.
 */
export async function listProductKindIds(
  boutiqueId: string,
): Promise<Record<string, string | null>> {
  const { data, error } = await client()
    .from("tr_products")
    .select("id, kind_id")
    .eq("boutique_id", boutiqueId);
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return {};
  }
  const out: Record<string, string | null> = {};
  for (const row of data ?? []) {
    out[String(row.id)] = typeof row.kind_id === "string" ? row.kind_id : null;
  }
  return out;
}

/** The Ürün türleri list: each kind with how many products have it. */
export async function listKindEntries(boutiqueId: string): Promise<{
  kinds: TrProductKindListEntry[];
  productKinds: Record<string, string | null>;
}> {
  const [kinds, productKinds] = await Promise.all([
    listKinds(boutiqueId),
    listProductKindIds(boutiqueId),
  ]);
  const counts = new Map<string, number>();
  for (const kindId of Object.values(productKinds)) {
    if (kindId) counts.set(kindId, (counts.get(kindId) ?? 0) + 1);
  }
  return {
    kinds: kinds.map((kind) => ({ ...kind, productCount: counts.get(kind.id) ?? 0 })),
    productKinds,
  };
}

/** Checks a kind's references against the boutique's own fields, types and categories. */
async function resolveForBoutique(
  boutiqueId: string,
  input: TrProductKindInput,
): Promise<TrProductKindInput> {
  const [attributes, types, categories] = await Promise.all([
    listAttributes(boutiqueId),
    listVariantTypes(boutiqueId),
    listCategories(boutiqueId),
  ]);
  try {
    return resolveKindInput(input, {
      attributes,
      variantTypeIds: new Set(types.map((type) => type.id)),
      categoryIds: new Set(categories.map((category) => category.id)),
    });
  } catch (problem) {
    throw new ProductKindError(problem instanceof Error ? problem.message : "Ürün türü geçersiz.");
  }
}

async function writeKindAttributes(kindId: string, links: readonly TrKindAttribute[]) {
  const supabase = client();
  const { error: clearError } = await supabase
    .from("tr_product_kind_attributes")
    .delete()
    .eq("kind_id", kindId);
  if (clearError) failure(clearError, "");
  if (links.length === 0) return;
  const { error } = await supabase.from("tr_product_kind_attributes").insert(
    links.map((link, sortOrder) => ({
      kind_id: kindId,
      attribute_id: link.attributeId,
      required: link.required,
      options: link.options,
      sort_order: sortOrder,
    })),
  );
  if (error) failure(error, "");
}

function duplicateName(name: string): string {
  return `“${name}” adında bir ürün türü zaten var.`;
}

export async function createKind(
  boutiqueId: string,
  input: TrProductKindInput,
  systemKey: string | null = null,
): Promise<TrProductKind> {
  const existing = await listKinds(boutiqueId);
  if (existing.length >= PRODUCT_KIND_LIMITS.kindsMax) {
    throw new ProductKindError(`En fazla ${PRODUCT_KIND_LIMITS.kindsMax} ürün türü ekleyebilirsiniz.`);
  }
  if (hasNamed(existing, input.name, (row) => row.name)) {
    throw new ProductKindError(duplicateName(input.name), 409);
  }
  const resolved = await resolveForBoutique(boutiqueId, input);
  const nextOrder = existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
  const { data, error } = await client()
    .from("tr_product_kinds")
    .insert({
      boutique_id: boutiqueId,
      name: resolved.name,
      system_key: systemKey,
      default_option_type_ids: resolved.defaultOptionTypeIds,
      suggested_category_id: resolved.suggestedCategoryId,
      sort_order: nextOrder,
    })
    .select("*")
    .single();
  if (error) failure(error, duplicateName(input.name));
  const kindId = String((data as Record<string, unknown>).id);
  try {
    await writeKindAttributes(kindId, resolved.attributes);
  } catch (linksError) {
    // No transaction across the two writes: don't leave a kind without its fields.
    await client().from("tr_product_kinds").delete().eq("id", kindId);
    throw linksError;
  }
  return (await getKind(kindId))!;
}

export async function updateKind(id: string, input: TrProductKindInput): Promise<TrProductKind> {
  const current = await getKind(id);
  if (!current) throw new ProductKindError("Ürün türü bulunamadı.", 404);
  const siblings = await listKinds(current.boutiqueId);
  if (hasNamed(siblings, input.name, (row) => row.name, id)) {
    throw new ProductKindError(duplicateName(input.name), 409);
  }
  const resolved = await resolveForBoutique(current.boutiqueId, input);
  const { error } = await client()
    .from("tr_product_kinds")
    .update({
      name: resolved.name,
      default_option_type_ids: resolved.defaultOptionTypeIds,
      suggested_category_id: resolved.suggestedCategoryId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) failure(error, duplicateName(input.name));
  await writeKindAttributes(id, resolved.attributes);
  return (await getKind(id))!;
}

/** Deletes a kind; its products keep everything but have no kind afterwards. */
export async function deleteKind(id: string): Promise<void> {
  const { error } = await client().from("tr_product_kinds").delete().eq("id", id);
  if (error) failure(error, "");
}

/**
 * A product body's `kindId`: `undefined` (not sent), `null` (clear) or the id of one of
 * the boutique's kinds. Throws a sentence for the owner when it isn't theirs.
 */
export async function readProductKindId(
  boutiqueId: string,
  raw: unknown,
): Promise<string | null | undefined> {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  if (typeof raw !== "string") throw new ProductKindError("Ürün türü geçersiz.");
  const kind = await getKind(raw);
  if (!kind || kind.boutiqueId !== boutiqueId) {
    throw new ProductKindError("Ürün türü bulunamadı.", 404);
  }
  return kind.id;
}

/** Sets (or clears, with `null`) the kind of some of the boutique's products. */
export async function setProductsKind(
  boutiqueId: string,
  kindId: string | null,
  productIds: readonly string[],
): Promise<void> {
  if (kindId) {
    const kind = await getKind(kindId);
    if (!kind || kind.boutiqueId !== boutiqueId) {
      throw new ProductKindError("Ürün türü bulunamadı.", 404);
    }
  }
  if (productIds.length === 0) return;
  const { error } = await client()
    .from("tr_products")
    .update({ kind_id: kindId })
    .eq("boutique_id", boutiqueId)
    .in("id", [...productIds]);
  if (error) failure(error, "");
}

// ---------------------------------------------------------------- template import

/**
 * Copies a starter template into the boutique's own rows (fields and kinds it doesn't
 * have yet), then gives every product without a kind the one its category maps to.
 */
export async function importKindTemplate(
  boutiqueId: string,
  template: TrKindTemplate,
  kindKeyForCategory: (
    slug: string | null,
    categories: Awaited<ReturnType<typeof listCategories>>,
  ) => string | null,
): Promise<{ kinds: number; attributes: number; assigned: number }> {
  const [attributes, kinds, variantTypes, categories] = await Promise.all([
    listAttributes(boutiqueId),
    listKinds(boutiqueId),
    listVariantTypes(boutiqueId),
    listCategories(boutiqueId),
  ]);
  const plan = planKindImport(template, { attributes, kinds, variantTypes, categories });

  const idByKey = new Map(attributes.map((attribute) => [attribute.key, attribute.id]));
  for (const attribute of plan.attributes) {
    const created = await createAttribute(boutiqueId, attribute, attribute.key);
    idByKey.set(created.key, created.id);
  }
  for (const kind of plan.kinds) {
    await createKind(
      boutiqueId,
      {
        name: kind.name,
        defaultOptionTypeIds: kind.defaultOptionTypeIds,
        suggestedCategoryId: kind.suggestedCategoryId,
        attributes: kind.attributes.map((link) => ({
          attributeId: idByKey.get(link.key)!,
          required: link.required,
          options: link.options,
        })),
      },
      kind.systemKey,
    );
  }

  const [allKinds, productKinds, products] = await Promise.all([
    listKinds(boutiqueId),
    listProductKindIds(boutiqueId),
    client().from("tr_products").select("id, category").eq("boutique_id", boutiqueId),
  ]);
  if (products.error) throw products.error;
  const assignments = planKindAssignments(
    (products.data ?? []).map((row) => ({
      id: String(row.id),
      category: typeof row.category === "string" ? row.category : null,
      kindId: productKinds[String(row.id)] ?? null,
    })),
    (slug) => kindKeyForCategory(slug, categories),
    allKinds,
  );
  let assigned = 0;
  for (const [kindId, productIds] of assignments) {
    await setProductsKind(boutiqueId, kindId, productIds);
    assigned += productIds.length;
  }
  return { kinds: plan.kinds.length, attributes: plan.attributes.length, assigned };
}
