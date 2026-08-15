"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyDemoOrderOverrides,
  emptyDemoOrderOverrides,
  readDemoOrderOverrides,
  writeDemoOrderOverrides,
  type DemoShopperOrder,
  type DemoShopperOrderOverrides,
} from "@/lib/tr/commerce/demoShopperOrders";

export function useDemoShopperOrders(
  boutiqueSlug: string,
  seed: DemoShopperOrder[],
) {
  const [overrides, setOverrides] = useState<DemoShopperOrderOverrides>(
    emptyDemoOrderOverrides,
  );

  useEffect(() => {
    setOverrides(readDemoOrderOverrides(boutiqueSlug));
  }, [boutiqueSlug]);

  const orders = useMemo(
    () => applyDemoOrderOverrides(seed, overrides),
    [overrides, seed],
  );

  const cancelItems = useCallback(
    (orderId: string, itemIds: string[]) => {
      setOverrides((prev) => {
        const existing = prev.cancelledItemIdsByOrder[orderId] ?? [];
        const next: DemoShopperOrderOverrides = {
          cancelledItemIdsByOrder: {
            ...prev.cancelledItemIdsByOrder,
            [orderId]: Array.from(new Set([...existing, ...itemIds])),
          },
        };
        writeDemoOrderOverrides(boutiqueSlug, next);
        return next;
      });
    },
    [boutiqueSlug],
  );

  return { orders, cancelItems };
}
