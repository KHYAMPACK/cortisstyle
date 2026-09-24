"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
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

interface TrBoutiqueLocalFavoritesStore {
  items: TrFavoriteItem[];
  addItem: (item: TrFavoriteItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: TrFavoriteItem) => void;
  hasItem: (productId: string) => boolean;
}

type FavoritesStore = UseBoundStore<StoreApi<TrBoutiqueLocalFavoritesStore>> & {
  persist?: {
    hasHydrated: () => boolean;
    onFinishHydration: (callback: () => void) => () => void;
  };
};

const storeCache = new Map<string, FavoritesStore>();

function createBoutiqueLocalFavoritesStore(
  boutiqueSlug: string,
  persistEnabled: boolean,
): FavoritesStore {
  if (!persistEnabled) {
    return create<TrBoutiqueLocalFavoritesStore>()((set, get) => ({
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
    })) as FavoritesStore;
  }

  return create<TrBoutiqueLocalFavoritesStore>()(
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
        name: `cortis-tr-favorites:boutique:${boutiqueSlug}`,
        partialize: (state) => ({ items: state.items }),
      },
    ),
  ) as FavoritesStore;
}

/** Per-boutique favorites — separate from marketplace favorites. */
export function getTrBoutiqueLocalFavoritesStore(
  boutiqueSlug: string,
): FavoritesStore {
  const slug = boutiqueSlug.trim();
  const persistEnabled = !slug.startsWith("__");
  const cacheKey = `${slug}:${persistEnabled ? "p" : "m"}`;
  let store = storeCache.get(cacheKey);
  if (!store) {
    store = createBoutiqueLocalFavoritesStore(slug, persistEnabled);
    storeCache.set(cacheKey, store);
  }
  return store;
}

export function selectBoutiqueFavoriteCount(
  state: TrBoutiqueLocalFavoritesStore,
): number {
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
