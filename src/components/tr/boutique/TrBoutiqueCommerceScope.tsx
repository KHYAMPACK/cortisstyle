"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { useTrPersistedHydration } from "@/lib/tr/useTrPersistedHydration";
import { getTrBoutiqueLocalCartStore } from "@/store/trBoutiqueLocalCartStore";
import { getTrBoutiqueLocalFavoritesStore } from "@/store/trBoutiqueLocalFavoritesStore";
import {
  selectFavoriteCount,
  useTrFavoritesStore,
  type TrFavoriteItem,
} from "@/store/trFavoritesStore";
import {
  selectCartItemCount,
  useTrCartStore,
} from "@/store/trCartStore";
import type { TrCartLineItem } from "@/types/tr-cart";

export type TrBoutiqueCommercePanel =
  | "cart"
  | "favorites"
  | "tracking"
  | "report"
  | "help"
  | null;

interface TrBoutiqueCommerceScopeValue {
  boutiqueSlug: string;
  boutiqueName: string;
  localCommerce: true;
  activePanel: TrBoutiqueCommercePanel;
  openPanel: (panel: Exclude<TrBoutiqueCommercePanel, null>) => void;
  closePanel: () => void;
}

const TrBoutiqueCommerceScopeContext =
  createContext<TrBoutiqueCommerceScopeValue | null>(null);

/** Stable unused slug so hooks always subscribe to a store instance. */
const UNUSED_SLUG = "__tr-boutique-commerce-unused__";

interface TrBoutiqueCommerceScopeProviderProps {
  boutiqueSlug: string;
  boutiqueName: string;
  children: ReactNode;
}

export function TrBoutiqueCommerceScopeProvider({
  boutiqueSlug,
  boutiqueName,
  children,
}: TrBoutiqueCommerceScopeProviderProps) {
  const [activePanel, setActivePanel] =
    useState<TrBoutiqueCommercePanel>(null);

  const openPanel = useCallback(
    (panel: Exclude<TrBoutiqueCommercePanel, null>) => {
      setActivePanel(panel);
    },
    [],
  );

  const closePanel = useCallback(() => setActivePanel(null), []);

  const value = useMemo(
    () => ({
      boutiqueSlug,
      boutiqueName,
      localCommerce: true as const,
      activePanel,
      openPanel,
      closePanel,
    }),
    [activePanel, boutiqueName, boutiqueSlug, closePanel, openPanel],
  );

  return (
    <TrBoutiqueCommerceScopeContext.Provider value={value}>
      {children}
    </TrBoutiqueCommerceScopeContext.Provider>
  );
}

export function useTrBoutiqueCommerceScopeOptional(): TrBoutiqueCommerceScopeValue | null {
  return useContext(TrBoutiqueCommerceScopeContext);
}

export function useTrBoutiqueCommerceScope(): TrBoutiqueCommerceScopeValue {
  const context = useContext(TrBoutiqueCommerceScopeContext);
  if (!context) {
    throw new Error(
      "useTrBoutiqueCommerceScope must be used within TrBoutiqueCommerceScopeProvider",
    );
  }
  return context;
}

/**
 * Cart API: boutique-local when inside editorial commerce scope,
 * otherwise the marketplace multi-tenant cart (unchanged).
 */
export function useTrScopedCart() {
  const scope = useTrBoutiqueCommerceScopeOptional();
  const localSlug = scope?.boutiqueSlug ?? UNUSED_SLUG;
  const localStore = useMemo(
    () => getTrBoutiqueLocalCartStore(localSlug),
    [localSlug],
  );

  const globalItems = useTrCartStore((state) => state.items);
  const globalAdd = useTrCartStore((state) => state.addItem);
  const globalRemove = useTrCartStore((state) => state.removeItem);
  const globalClear = useTrCartStore((state) => state.clearCart);
  const globalCount = useTrCartStore(selectCartItemCount);
  const globalHydrated = useTrPersistedHydration(useTrCartStore.persist);

  const localItems = useStore(localStore, (state) => state.items);
  const localAdd = useStore(localStore, (state) => state.addItem);
  const localRemove = useStore(localStore, (state) => state.removeItem);
  const localClear = useStore(localStore, (state) => state.clearCart);
  const localCount = useStore(localStore, (state) => state.items.length);
  const localHydrated = useTrPersistedHydration(localStore.persist);

  if (scope) {
    return {
      scoped: true as const,
      boutiqueSlug: scope.boutiqueSlug,
      items: localItems,
      addItem: localAdd as (item: TrCartLineItem) => boolean,
      removeItem: localRemove,
      clearCart: localClear,
      itemCount: localCount,
      hydrated: localHydrated,
      hasItem: (productId: string) =>
        localItems.some((entry) => entry.productId === productId),
    };
  }

  return {
    scoped: false as const,
    boutiqueSlug: null as string | null,
    items: globalItems,
    addItem: globalAdd,
    removeItem: globalRemove,
    clearCart: globalClear,
    itemCount: globalCount,
    hydrated: globalHydrated,
    hasItem: (productId: string) =>
      globalItems.some((entry) => entry.productId === productId),
  };
}

/**
 * Favorites API: boutique-local when inside editorial commerce scope,
 * otherwise marketplace favorites (unchanged).
 */
export function useTrScopedFavorites() {
  const scope = useTrBoutiqueCommerceScopeOptional();
  const localSlug = scope?.boutiqueSlug ?? UNUSED_SLUG;
  const localStore = useMemo(
    () => getTrBoutiqueLocalFavoritesStore(localSlug),
    [localSlug],
  );

  const globalItems = useTrFavoritesStore((state) => state.items);
  const globalToggle = useTrFavoritesStore((state) => state.toggleItem);
  const globalRemove = useTrFavoritesStore((state) => state.removeItem);
  const globalCount = useTrFavoritesStore(selectFavoriteCount);
  const globalHydrated = useTrPersistedHydration(useTrFavoritesStore.persist);

  const localItems = useStore(localStore, (state) => state.items);
  const localToggle = useStore(localStore, (state) => state.toggleItem);
  const localRemove = useStore(localStore, (state) => state.removeItem);
  const localCount = useStore(localStore, (state) => state.items.length);
  const localHydrated = useTrPersistedHydration(localStore.persist);

  if (scope) {
    return {
      scoped: true as const,
      boutiqueSlug: scope.boutiqueSlug,
      items: localItems,
      toggleItem: localToggle as (item: TrFavoriteItem) => void,
      removeItem: localRemove,
      itemCount: localCount,
      hydrated: localHydrated,
      hasItem: (productId: string) =>
        localItems.some((entry) => entry.productId === productId),
    };
  }

  return {
    scoped: false as const,
    boutiqueSlug: null as string | null,
    items: globalItems,
    toggleItem: globalToggle,
    removeItem: globalRemove,
    itemCount: globalCount,
    hydrated: globalHydrated,
    hasItem: (productId: string) =>
      globalItems.some((entry) => entry.productId === productId),
  };
}
