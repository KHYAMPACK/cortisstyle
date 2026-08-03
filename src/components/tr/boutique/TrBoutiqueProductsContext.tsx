"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type {
  TrBoutiquePublic,
  TrProduct,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

interface TrBoutiqueProductsContextValue {
  boutique: TrBoutiquePublic;
  products: TrProductWithBoutique[];
}

const TrBoutiqueProductsContext =
  createContext<TrBoutiqueProductsContextValue | null>(null);

interface TrBoutiqueProductsProviderProps {
  boutique: TrBoutiquePublic;
  products: TrProduct[];
  children: ReactNode;
}

export function TrBoutiqueProductsProvider({
  boutique,
  products,
  children,
}: TrBoutiqueProductsProviderProps) {
  const value = useMemo(() => {
    const withBoutique: TrProductWithBoutique[] = products.map((product) => ({
      ...product,
      boutique,
    }));
    return { boutique, products: withBoutique };
  }, [boutique, products]);

  return (
    <TrBoutiqueProductsContext.Provider value={value}>
      {children}
    </TrBoutiqueProductsContext.Provider>
  );
}

export function useTrBoutiqueProducts(): TrBoutiqueProductsContextValue {
  const context = useContext(TrBoutiqueProductsContext);
  if (!context) {
    throw new Error(
      "useTrBoutiqueProducts must be used within TrBoutiqueProductsProvider",
    );
  }
  return context;
}

export function useTrBoutiqueProductsOptional(): TrBoutiqueProductsContextValue | null {
  return useContext(TrBoutiqueProductsContext);
}
