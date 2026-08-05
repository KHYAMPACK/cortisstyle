"use client";

import { useEffect, useState } from "react";
import { fetchOwnerOrders } from "@/lib/tr/ownerClient";
import {
  getOrdersSeenAt,
  hasUnseenOrders,
  isPaidLikeOrder,
  ORDERS_SEEN_EVENT,
} from "@/lib/tr/orderNotifications";
import type { TrOrderWithItems } from "@/types/tr-marketplace";

/**
 * Boutique orders for home “yeni siparişler” + Siparişler nav badge.
 */
export function useOwnerOrderAlerts(boutiqueId: string | null | undefined) {
  const [orders, setOrders] = useState<TrOrderWithItems[]>([]);
  const [loading, setLoading] = useState(Boolean(boutiqueId));
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
    let latest: TrOrderWithItems[] = [];

    const syncBadge = (list: TrOrderWithItems[]) => {
      setHasNewOrders(hasUnseenOrders(list, getOrdersSeenAt(id)));
    };

    async function load() {
      setLoading(true);
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
  }, [boutiqueId]);

  const recentOrders = orders.filter(isPaidLikeOrder).slice(0, 8);

  return { orders, recentOrders, hasNewOrders, loading };
}
