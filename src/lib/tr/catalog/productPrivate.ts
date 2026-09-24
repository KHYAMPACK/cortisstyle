import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { EMPTY_PRODUCT_PRIVATE, parseTryToKurus } from "@/types/tr-marketplace";
import type { TrProductPrivate } from "@/types/tr-marketplace";

/**
 * Owner-only product data lives in `tr_product_private` (service role only)
 * because `tr_products` is publicly readable, column by column. Never add these
 * fields to `TrProduct` or to a storefront column list.
 */

const TABLE = "tr_product_private";

/** PostgREST / Postgres "table does not exist" (patch_product_types.sql not applied yet). */
function isMissingTable(error: { code?: string; message?: string }): boolean {
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}

/** The supplier / HS code columns come from patch_product_details.sql. */
function isMissingDetailColumn(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? "";
  if (!/(supplier|hs_code)/i.test(message)) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /does not exist|schema cache/i.test(message)
  );
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export async function getProductPrivateAdmin(
  productId: string,
): Promise<TrProductPrivate> {
  const supabase = getServiceSupabase();
  if (!supabase) return EMPTY_PRODUCT_PRIVATE;

  let { data, error } = await supabase
    .from(TABLE)
    .select("cost_price_kurus, supplier, hs_code")
    .eq("product_id", productId)
    .maybeSingle();

  // Before patch_product_details.sql only the cost exists.
  if (error && isMissingDetailColumn(error)) {
    ({ data, error } = await supabase
      .from(TABLE)
      .select("cost_price_kurus")
      .eq("product_id", productId)
      .maybeSingle());
  }

  if (error) {
    if (!isMissingTable(error)) throw error;
    console.warn(
      `[tr/products] ${TABLE} missing — apply supabase/patch_product_types.sql.`,
    );
    return EMPTY_PRODUCT_PRIVATE;
  }

  return {
    costPriceKurus:
      typeof data?.cost_price_kurus === "number" ? data.cost_price_kurus : null,
    supplier: textOrNull(data?.supplier),
    hsCode: textOrNull(data?.hs_code),
  };
}

/**
 * Writes are not silently dropped: a missing table (or a missing supplier / HS code
 * column) is an error the owner can see. `undefined` fields are left as they are;
 * `null` clears one. An empty supplier / HS code never touches a database that lacks
 * the columns.
 */
export async function saveProductPrivateAdmin(input: {
  productId: string;
  boutiqueId: string;
  costPriceKurus?: number | null;
  supplier?: string | null;
  hsCode?: string | null;
}): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const values: Record<string, unknown> = {};
  if (input.costPriceKurus !== undefined) values.cost_price_kurus = input.costPriceKurus;
  if (input.supplier !== undefined) values.supplier = input.supplier;
  if (input.hsCode !== undefined) values.hs_code = input.hsCode;

  const write = (row: Record<string, unknown>) =>
    supabase.from(TABLE).upsert(
      {
        product_id: input.productId,
        boutique_id: input.boutiqueId,
        ...row,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );

  let { error } = await write(values);

  if (error && isMissingDetailColumn(error)) {
    const wantsDetails =
      (input.supplier !== undefined && input.supplier !== null) ||
      (input.hsCode !== undefined && input.hsCode !== null);
    if (wantsDetails) {
      throw new Error(
        "Tedarikçi / HS kodu kaydedilemedi: veritabanı güncellemesi (patch_product_details.sql) henüz uygulanmamış.",
      );
    }
    const rest = Object.fromEntries(
      Object.entries(values).filter(([column]) => column !== "supplier" && column !== "hs_code"),
    );
    // Nothing else to save (an empty supplier / HS code on a database without them).
    if (Object.keys(rest).length === 0) return;
    ({ error } = await write(rest));
  }

  if (error) {
    if (isMissingTable(error)) {
      throw new Error(
        "Ürünün özel bilgileri kaydedilemedi: veritabanı güncellemesi (patch_product_types.sql) henüz uygulanmamış.",
      );
    }
    throw error;
  }
}

/**
 * Request-body reader shared by the create and update routes. `undefined` means
 * the client did not send it (leave it alone), `null` clears the cost, and a bad
 * amount throws a readable Error.
 */
export function readCostPriceKurus(
  body: Record<string, unknown>,
): number | null | undefined {
  if (body.costPriceKurus === undefined && body.costPriceTry === undefined) {
    return undefined;
  }
  if (body.costPriceKurus === null || body.costPriceTry === null) return null;

  if (typeof body.costPriceKurus === "number") {
    const kurus = Math.round(body.costPriceKurus);
    if (!Number.isFinite(kurus) || kurus < 0) {
      throw new Error("Alış fiyatı geçersiz.");
    }
    return kurus;
  }

  const raw = String(body.costPriceTry ?? "").trim();
  if (!raw) return null;
  try {
    return parseTryToKurus(raw);
  } catch {
    throw new Error("Alış fiyatı geçersiz.");
  }
}
