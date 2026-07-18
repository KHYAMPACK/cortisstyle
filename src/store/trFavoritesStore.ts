import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProductCoverImageFor } from "@/lib/tr/productImages";
import type { TrProduct, TrProductWithBoutique } from "@/types/tr-marketplace";

export interface TrFavoriteItem {
  productId: string;
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  title: string;
  priceKurus: number;
  image: string | null;
  category: string | null;
}

interface TrFavoritesStore {
  items: TrFavoriteItem[];
  addItem: (item: TrFavoriteItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: TrFavoriteItem) => void;
  hasItem: (productId: string) => boolean;
}

export const TR_FAVORITES_STORAGE_KEY = "cortis-tr-favorites";

export const useTrFavoritesStore = create<TrFavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (get().items.some((entry) => entry.productId === item.productId)) {
          return;
        }
        set({ items: [...get().items, item] });
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((entry) => entry.productId !== productId),
        });
      },

      toggleItem: (item) => {
        if (get().hasItem(item.productId)) {
          get().removeItem(item.productId);
          return;
        }
        get().addItem(item);
      },

      hasItem: (productId) =>
        get().items.some((entry) => entry.productId === productId),
    }),
    {
      name: TR_FAVORITES_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function selectFavoriteCount(state: TrFavoritesStore): number {
  return state.items.length;
}

export function favoriteSnapshotFromProduct(
  product: TrProduct | TrProductWithBoutique,
  options?: { boutiqueSlug?: string; boutiqueName?: string },
): TrFavoriteItem | null {
  const nested =
    "boutique" in product && product.boutique ? product.boutique : null;
  const boutiqueSlug =
    options?.boutiqueSlug?.trim() || nested?.slug?.trim() || "";
  if (!boutiqueSlug) return null;

  const boutiqueName =
    options?.boutiqueName?.trim() || nested?.name?.trim() || "Butik";
  const image = getProductCoverImageFor("marketplace", product);

  return {
    productId: product.id,
    boutiqueId: product.boutiqueId,
    boutiqueName,
    boutiqueSlug,
    title: product.title,
    priceKurus: product.priceKurus,
    image,
    category: product.category,
  };
}
