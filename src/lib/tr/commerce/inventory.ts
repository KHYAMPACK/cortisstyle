import { getServiceSupabase } from "@/lib/supabaseAdmin";
import type { InventoryLine } from "@/lib/tr/commerce/inventoryLines";
import { getProductByIdAdmin } from "@/lib/tr/products";
import { sumSizeStocks } from "@/lib/tr/sizeStocks";
import { sumActiveStock } from "@/lib/tr/variants/productVariantRules";
import type { TrProduct, TrProductStatus } from "@/types/tr-marketplace";

export type { InventoryLine };

export type InventoryClient = NonNullable<ReturnType<typeof getServiceSupabase>>;
type Supabase = InventoryClient;

function deriveStatus(nextStock: number, current: TrProductStatus): TrProductStatus {
  if (nextStock <= 0) return "sold";
  if (current === "sold") return "available";
  return current;
}

/**
 * A product with variants keeps its own stock as the sum of its active variants'
 * stock (the product editor does the same on save). Call after a variant's stock moved.
 * Only a sellable product's status follows the stock (available ⇄ sold).
 */
export async function syncProductStockFromVariants(
  supabase: Supabase,
  product: TrProduct,
): Promise<void> {
  const { data, error } = await supabase
    .from("tr_product_variants")
    .select("stock, active")
    .eq("product_id", product.id);
  if (error) throw error;

  const total = sumActiveStock(
    (data ?? []).map((row) => ({
      stock: typeof row.stock === "number" ? row.stock : 0,
      active: row.active !== false,
    })),
  );
  const status =
    product.status === "available" || product.status === "sold"
      ? deriveStatus(total, product.status)
      : product.status;

  const { error: updateError } = await supabase
    .from("tr_products")
    .update({ stock: total, status })
    .eq("id", product.id);
  if (updateError) throw updateError;
}

/**
 * Take `quantity` from one variant, refusing when it is missing, inactive or short.
 * The update only lands if the variant's stock is still what we read, so two orders for
 * the last unit can't both succeed.
 */
export async function decrementVariantLine(
  supabase: Supabase,
  product: TrProduct,
  variantId: string | null,
  quantity: number,
): Promise<void> {
  if (!variantId) {
    throw new Error(`"${product.title}" için seçenek artık satışta değil.`);
  }
  const { data: row, error } = await supabase
    .from("tr_product_variants")
    .select("id, product_id, stock, active")
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.product_id !== product.id) {
    throw new Error(`"${product.title}" için seçenek bulunamadı.`);
  }
  if (row.active === false) {
    throw new Error(`"${product.title}" için seçilen seçenek satışta değil.`);
  }
  if (row.stock < quantity) {
    throw new Error(`"${product.title}" için seçilen seçenek stokta yok.`);
  }

  const { data, error: updateError } = await supabase
    .from("tr_product_variants")
    .update({
      stock: row.stock - quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("stock", row.stock)
    .select("id")
    .maybeSingle();
  if (updateError) throw updateError;
  if (!data) {
    throw new Error(
      `"${product.title}" stok güncellenemedi (eşzamanlı satış veya yetersiz stok).`,
    );
  }

  await syncProductStockFromVariants(supabase, product);
}

/** Give `quantity` back to one variant. A variant that no longer exists has nothing to give back to. */
export async function restoreVariantLine(
  supabase: Supabase,
  product: TrProduct,
  variantId: string | null,
  quantity: number,
): Promise<void> {
  if (!variantId) return;
  const { data: row, error } = await supabase
    .from("tr_product_variants")
    .select("id, product_id, stock")
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.product_id !== product.id) return;

  const { error: updateError } = await supabase
    .from("tr_product_variants")
    .update({ stock: row.stock + quantity, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (updateError) throw updateError;

  await syncProductStockFromVariants(supabase, product);
}

/**
 * Decrement stock / size_stocks after validating availability.
 * Uses conditional updates where possible to reduce oversell races.
 * Call **before** inserting the order when possible; pair with restore on failure.
 */
export async function decrementInventoryForOrderLines(
  lines: InventoryLine[],
): Promise<void> {
  if (lines.length === 0) return;

  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  for (const line of lines) {
    const quantity = Math.max(1, Math.floor(line.quantity));
    const product = await getProductByIdAdmin(line.productId);
    if (!product) {
      throw new Error("Sipariş ürünü stok güncellemesi için bulunamadı.");
    }
    if (product.status !== "available") {
      throw new Error(`"${product.title}" satışta değil.`);
    }

    if (line.variant) {
      await decrementVariantLine(supabase, product, line.variant.id, quantity);
      continue;
    }

    const size = line.size?.trim() || null;
    let nextStock = product.stock;
    let nextSizeStocks = { ...product.sizeStocks };
    const hasSizeMap = Object.keys(product.sizeStocks).length > 0;

    if (size && hasSizeMap) {
      const current = product.sizeStocks[size] ?? 0;
      if (current < quantity) {
        throw new Error(`"${product.title}" (${size}) stokta yok.`);
      }
      nextSizeStocks = {
        ...product.sizeStocks,
        [size]: current - quantity,
      };
      nextStock = sumSizeStocks(nextSizeStocks);
    } else {
      if (product.stock < quantity) {
        throw new Error(`"${product.title}" stokta yok.`);
      }
      nextStock = product.stock - quantity;
    }

    const nextStatus = deriveStatus(nextStock, product.status);

    const { data, error } = await supabase
      .from("tr_products")
      .update({
        stock: Math.max(0, nextStock),
        size_stocks: nextSizeStocks,
        status: nextStatus,
      })
      .eq("id", product.id)
      .eq("status", "available")
      .eq("stock", product.stock)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error(
        `"${product.title}" stok güncellenemedi (eşzamanlı satış veya yetersiz stok).`,
      );
    }
  }
}

/** Reverse a previous decrement (e.g. cancel or failed order insert). */
export async function restoreInventoryForOrderLines(
  lines: InventoryLine[],
): Promise<void> {
  if (lines.length === 0) return;

  const supabase = getServiceSupabase();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  for (const line of lines) {
    const quantity = Math.max(1, Math.floor(line.quantity));
    const product = await getProductByIdAdmin(line.productId);
    if (!product) continue;

    if (line.variant) {
      await restoreVariantLine(supabase, product, line.variant.id, quantity);
      continue;
    }

    const size = line.size?.trim() || null;
    let nextSizeStocks = { ...product.sizeStocks };
    let nextStock = product.stock;
    const hasSizeMap = Object.keys(product.sizeStocks).length > 0;

    if (size && hasSizeMap) {
      nextSizeStocks = {
        ...product.sizeStocks,
        [size]: (product.sizeStocks[size] ?? 0) + quantity,
      };
      nextStock = sumSizeStocks(nextSizeStocks);
    } else {
      nextStock = product.stock + quantity;
    }

    const nextStatus = deriveStatus(nextStock, product.status);

    const { error } = await supabase
      .from("tr_products")
      .update({
        stock: nextStock,
        size_stocks: nextSizeStocks,
        status: nextStatus,
      })
      .eq("id", product.id);

    if (error) throw error;
  }
}
