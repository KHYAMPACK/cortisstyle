import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { parseTryToKurus } from "@/types/tr-marketplace";
import type { TrProductPrivate } from "@/types/tr-marketplace";

/**
 * Owner-only product data lives in `tr_product_private` (service role only)
 * because `tr_products` is publicly readable, column by column. Never add these
 * fields to `TrProduct` or to a storefront column list.
 */

export const EMPTY_PRODUCT_PRIVATE: TrProductPrivate = { costPriceKurus: null };

const TABLE = "tr_product_private";

/** PostgREST / Postgres "table does not exist" (patch_product_types.sql not applied yet). */
function isMissingTable(error: { code?: string; message?: string }): boolean {
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}

export async function getProductPrivateAdmin(
  productId: string,
): Promise<TrProductPrivate> {
  const supabase = getServiceSupabase();
  if (!supabase) return EMPTY_PRODUCT_PRIVATE;

  const { data, error } = await supabase
    .from(TABLE)
    .select("cost_price_kurus")
    .eq("product_id", productId)
    .maybeSingle();

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
  };
}

/** Writes are not silently dropped: a missing table is an error the owner can see. */
export async function saveProductPrivateAdmin(input: {
  productId: string;
  boutiqueId: string;
  costPriceKurus: number | null;
}): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { error } = await supabase.from(TABLE).upsert(
    {
      product_id: input.productId,
      boutique_id: input.boutiqueId,
      cost_price_kurus: input.costPriceKurus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );

  if (error) {
    if (isMissingTable(error)) {
      throw new Error(
        "Alış fiyatı kaydedilemedi: veritabanı güncellemesi (patch_product_types.sql) henüz uygulanmamış.",
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
