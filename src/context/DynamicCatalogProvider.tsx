"use client";

import type { ReactNode } from "react";
import { refreshClothingItemRegistry } from "@/data/items";
import { refreshLooksRegistry } from "@/data/looks";
import { registerDiskDynamicCatalog } from "@/lib/dynamicLooks/registry";
import type { DynamicCatalogBundle } from "@/lib/dynamicLooks/types";

interface DynamicCatalogProviderProps {
  bundle: DynamicCatalogBundle;
  children: ReactNode;
}

let registeredBundle: DynamicCatalogBundle | null = null;

/** Hydrate client registries with the server fs crawl result. */
export function DynamicCatalogProvider({
  bundle,
  children,
}: DynamicCatalogProviderProps) {
  if (registeredBundle !== bundle) {
    registerDiskDynamicCatalog(bundle);
    refreshClothingItemRegistry();
    refreshLooksRegistry();
    registeredBundle = bundle;
  }

  return children;
}
