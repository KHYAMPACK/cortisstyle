import { getServiceSupabase } from "@/lib/supabaseAdmin";
import { getProductByIdAdmin } from "@/lib/tr/products";
import { sumSizeStocks } from "@/lib/tr/sizeStocks";
import type { TrProductStatus } from "@/types/tr-marketplace";

export type InventoryLine = {
  productId: string;
  size: string | null;
  quantity: number;
};

function deriveStatus(nextStock: number, current: TrProductStatus): TrProductStatus {
  if (nextStock <= 0) return "sold";
  if (current === "sold") return "available";
  return current;
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
