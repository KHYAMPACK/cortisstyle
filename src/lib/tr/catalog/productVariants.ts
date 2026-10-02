import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { listVariantTypes } from "@/lib/tr/catalog/variantTypes";
import { planVariantChanges, sumActiveStock } from "@/lib/tr/variants/productVariantRules";
import {
  EMPTY_PRODUCT_VARIANTS,
  mapProductVariantRow,
  type TrProductVariant,
  type TrProductVariants,
  type TrProductVariantsInput,
} from "@/lib/tr/variants/types";

/**
 * A Gelişmiş product's options and variants. Server only, through the service role.
 * Reads are tolerant (before `patch_product_variants.sql` a product simply has no
 * variants); saving real variants reports a missing schema instead of failing silently.
 */

type DbError = { code?: string; message?: string };

function isSchemaMissing(error: DbError): boolean {
  if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    return true;
  }
  return /does not exist|schema cache|could not find/i.test(error.message ?? "");
}

const SCHEMA_HINT =
  "Varyantlar kaydedilemedi: veritabanı güncellemesi (patch_product_variants.sql) henüz uygulanmamış.";

export class ProductVariantsError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 409 = 400,
  ) {
    super(message);
    this.name = "ProductVariantsError";
  }
}

function client() {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function failure(error: DbError): never {
  if (isSchemaMissing(error)) throw new ProductVariantsError(SCHEMA_HINT);
  if (error.code === "23505") {
    throw new ProductVariantsError("Aynı varyant iki kez eklenmiş.", 409);
  }
  throw error;
}

export async function getProductVariants(productId: string): Promise<TrProductVariants> {
  const supabase = client();
  const [options, variants] = await Promise.all([
    supabase
      .from("tr_product_options")
      .select("type_id, sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tr_product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true }),
  ]);
  for (const result of [options, variants]) {
    if (result.error) {
      if (!isSchemaMissing(result.error)) throw result.error;
      return EMPTY_PRODUCT_VARIANTS;
    }
  }
  return {
    typeIds: (options.data ?? []).map((row) => String(row.type_id)),
    variants: (variants.data ?? []).map((row) =>
      mapProductVariantRow(row as Record<string, unknown>),
    ),
  };
}

/**
 * The variants of several products in one query, keyed by product id (a product without
 * variants has no entry). For checkout, which needs them for every line of a cart.
 * Tolerant of `patch_product_variants.sql` not being applied: nothing has variants then.
 */
export async function listVariantsByProductIds(
  productIds: readonly string[],
): Promise<Map<string, TrProductVariant[]>> {
  const byProduct = new Map<string, TrProductVariant[]>();
  if (productIds.length === 0) return byProduct;
  const { data, error } = await client()
    .from("tr_product_variants")
    .select("*")
    .in("product_id", [...new Set(productIds)])
    .order("sort_order", { ascending: true });
  if (error) {
    if (!isSchemaMissing(error)) throw error;
    return byProduct;
  }
  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const productId = String(record.product_id);
    const list = byProduct.get(productId) ?? [];
    list.push(mapProductVariantRow(record));
    byProduct.set(productId, list);
  }
  return byProduct;
}

/**
 * Every variant of a boutique's Gelişmiş products, keyed by product id — what the manual
 * order picker lists. Products are read first and their variants by id in chunks (a
 * boutique can have far more products than one URL can name).
 */
export async function listVariantsByBoutique(
  boutiqueId: string,
): Promise<Map<string, TrProductVariant[]>> {
  const supabase = client();
  let ids: string[];
  // Only Gelişmiş products have variants; before product types exist, ask about all.
  const advanced = await supabase
    .from("tr_products")
    .select("id")
    .eq("boutique_id", boutiqueId)
    .eq("product_type", "advanced");
  if (advanced.error) {
    const all = await supabase.from("tr_products").select("id").eq("boutique_id", boutiqueId);
    if (all.error) throw all.error;
    ids = (all.data ?? []).map((row) => String(row.id));
  } else {
    ids = (advanced.data ?? []).map((row) => String(row.id));
  }

  const byProduct = new Map<string, TrProductVariant[]>();
  for (let start = 0; start < ids.length; start += 150) {
    const chunk = await listVariantsByProductIds(ids.slice(start, start + 150));
    for (const [productId, variants] of chunk) byProduct.set(productId, variants);
  }
  return byProduct;
}

/**
 * Sets one variant's stock (the Stok page) and keeps the product's stock the sum of its
 * active variants. `null` = no such variant in this boutique.
 */
export async function setVariantStock(args: {
  boutiqueId: string;
  variantId: string;
  stock: number;
}): Promise<{ variant: TrProductVariant; productId: string; productStock: number } | null> {
  const supabase = client();
  const found = await supabase
    .from("tr_product_variants")
    .select("product_id, tr_products!inner(boutique_id)")
    .eq("id", args.variantId)
    .eq("tr_products.boutique_id", args.boutiqueId)
    .maybeSingle();
  if (found.error) failure(found.error);
  if (!found.data) return null;
  const productId = String((found.data as Record<string, unknown>).product_id);

  const updated = await supabase
    .from("tr_product_variants")
    .update({ stock: Math.max(0, Math.round(args.stock)) })
    .eq("id", args.variantId)
    .select("*")
    .single();
  if (updated.error) failure(updated.error);

  const rows = await supabase
    .from("tr_product_variants")
    .select("stock, active")
    .eq("product_id", productId);
  if (rows.error) failure(rows.error);
  const productStock = sumActiveStock(
    (rows.data ?? []).map((row) => ({ stock: Number(row.stock) || 0, active: row.active !== false })),
  );
  const product = await supabase.from("tr_products").update({ stock: productStock }).eq("id", productId);
  if (product.error) throw product.error;

  return {
    variant: mapProductVariantRow(updated.data as Record<string, unknown>),
    productId,
    productStock,
  };
}

/** Looks up a variant value's label ("Kırmızı") among a boutique's variant types. */
export async function variantValueLabelOf(
  boutiqueId: string,
): Promise<(valueId: string) => string> {
  const labels = new Map<string, string>();
  for (const type of await listVariantTypes(boutiqueId)) {
    for (const value of type.values) labels.set(value.id, value.label);
  }
  return (valueId) => labels.get(valueId) ?? "?";
}

/**
 * Makes the product's options and variants exactly `input`. A variant is identified by
 * its combination of values: the same combination keeps its row (and id), new ones are
 * added, the rest are removed. An empty input clears them (the product then sells at
 * product level). `productImages` are the product's own images; a variant can only
 * point at those.
 */
export async function saveProductVariants(args: {
  productId: string;
  boutiqueId: string;
  input: TrProductVariantsInput;
  productImages: readonly string[];
}): Promise<TrProductVariants> {
  const { productId, boutiqueId, input, productImages } = args;
  const supabase = client();

  if (input.typeIds.length > 0) {
    // The types must be the boutique's, and every value must belong to its option.
    const types = await listVariantTypes(boutiqueId);
    const byId = new Map(types.map((type) => [type.id, type]));
    if (input.typeIds.some((typeId) => !byId.has(typeId))) {
      throw new ProductVariantsError("Seçilen varyant türü bulunamadı.");
    }
    if (input.typeIds.filter((typeId) => byId.get(typeId)!.hasPhotos).length > 1) {
      throw new ProductVariantsError("Bir üründe yalnızca bir fotoğraflı seçenek olabilir.");
    }
    for (const variant of input.variants) {
      variant.optionValueIds.forEach((valueId, index) => {
        const type = byId.get(input.typeIds[index]!)!;
        if (!type.values.some((value) => value.id === valueId)) {
          throw new ProductVariantsError("Bir varyant değeri seçilen türe ait değil.");
        }
      });
    }
  }

  const current = await getProductVariants(productId);
  if (input.typeIds.length === 0 && current.typeIds.length === 0) return current;

  const plan = planVariantChanges(current.variants, input.variants);
  const own = new Set(productImages);

  if (plan.remove.length > 0) {
    const { error } = await supabase
      .from("tr_product_variants")
      .delete()
      .in(
        "id",
        plan.remove.map((row) => row.id),
      );
    if (error) failure(error);
  }

  // Options: replace the list (the primary key is (product, type), so order changes
  // are updates and dropped types are deleted).
  const { error: dropError } = await supabase
    .from("tr_product_options")
    .delete()
    .eq("product_id", productId);
  if (dropError) failure(dropError);
  if (input.typeIds.length > 0) {
    const { error } = await supabase.from("tr_product_options").insert(
      input.typeIds.map((typeId, sortOrder) => ({
        product_id: productId,
        type_id: typeId,
        sort_order: sortOrder,
      })),
    );
    if (error) failure(error);
  }

  const now = new Date().toISOString();
  const orderOf = new Map(input.variants.map((row, index) => [row, index]));
  const columns = (row: (typeof input.variants)[number]) => ({
    product_id: productId,
    option_value_ids: row.optionValueIds,
    sku: row.sku,
    barcode: row.barcode,
    price_kurus: row.priceKurus,
    stock: row.stock,
    images: row.images.filter((url) => own.has(url)),
    active: row.active,
    sort_order: orderOf.get(row) ?? 0,
    updated_at: now,
  });

  if (plan.update.length > 0) {
    const { error } = await supabase.from("tr_product_variants").upsert(
      plan.update.map(({ existing, submitted }) => ({
        id: existing.id,
        ...columns(submitted),
      })),
      { onConflict: "id" },
    );
    if (error) failure(error);
  }
  if (plan.insert.length > 0) {
    const { error } = await supabase
      .from("tr_product_variants")
      .insert(plan.insert.map((row) => columns(row)));
    if (error) failure(error);
  }

  return getProductVariants(productId);
}

/**
 * Gives a copy of a product the same options and variants. SKU and barcode identify one
 * product, so the copy's stay empty.
 */
export async function copyProductVariants(args: {
  fromProductId: string;
  toProductId: string;
  boutiqueId: string;
  toProductImages: readonly string[];
}): Promise<void> {
  const source = await getProductVariants(args.fromProductId);
  if (source.typeIds.length === 0) return;
  await saveProductVariants({
    productId: args.toProductId,
    boutiqueId: args.boutiqueId,
    productImages: args.toProductImages,
    input: {
      typeIds: source.typeIds,
      variants: source.variants.map((variant) => ({
        optionValueIds: variant.optionValueIds,
        sku: null,
        barcode: null,
        priceKurus: variant.priceKurus,
        stock: variant.stock,
        images: variant.images,
        active: variant.active,
      })),
    },
  });
}

export function productVariantsErrorResponse(error: unknown): Response | null {
  return error instanceof ProductVariantsError
    ? Response.json({ error: error.message }, { status: error.status })
    : null;
}
