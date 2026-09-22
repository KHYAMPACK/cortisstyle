"use client";

import { useEffect, useState } from "react";
import { fetchOwnerOrders, peekOwnerOrders } from "@/lib/tr/ownerClient";
import {
  getOrdersSeenAt,
  hasUnseenOrders,
  isActionableOwnerOrder,
  ORDERS_SEEN_EVENT,
} from "@/lib/tr/orderNotifications";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

/**
 * Boutique orders for home “yeni siparişler” + Siparişler nav badge.
 */
export function useOwnerOrderAlerts(
  boutiqueId: string | null | undefined,
  cardCheckout = false,
) {
  const cached = boutiqueId ? peekOwnerOrders(boutiqueId) : undefined;
  const [orders, setOrders] = useState<TrOrderWithItems[]>(cached ?? []);
  const [loading, setLoading] = useState(Boolean(boutiqueId) && !cached);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  useEffect(() => {
    if (!boutiqueId) {
      setOrders([]);
      setHasNewOrders(false);
      setLoading(false);
      return;
    }

    const id = boutiqueId;
    let cancelled = false;
    let latest: TrOrderWithItems[] = peekOwnerOrders(id) ?? [];
    const listedOpts = { cardCheckout };

    const syncBadge = (list: TrOrderWithItems[]) => {
      setHasNewOrders(hasUnseenOrders(list, getOrdersSeenAt(id), listedOpts));
    };

    async function load() {
      try {
        const list = await fetchOwnerOrders(id);
        if (cancelled) return;
        latest = list;
        setOrders(list);
        syncBadge(list);
      } catch {
        if (!cancelled) {
          latest = [];
          setOrders([]);
          setHasNewOrders(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    const onFocus = () => void load();
    const onSeen = (event: Event) => {
      const detail = (event as CustomEvent<{ boutiqueId?: string }>).detail;
      if (detail?.boutiqueId && detail.boutiqueId !== id) return;
      syncBadge(latest);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener(ORDERS_SEEN_EVENT, onSeen);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(ORDERS_SEEN_EVENT, onSeen);
    };
  }, [boutiqueId, cardCheckout]);

  const recentOrders = orders
    .filter((order) => isActionableOwnerOrder(order, { cardCheckout }))
    .slice(0, 8);

  return { orders, recentOrders, hasNewOrders, loading };
}
