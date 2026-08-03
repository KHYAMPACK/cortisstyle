"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import type { TrFavoriteItem } from "@/store/trFavoritesStore";

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
