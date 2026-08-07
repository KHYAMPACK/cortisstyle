"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerOwnerPushServiceWorker } from "@/lib/tr/ownerPush";
import { trPanelOrdersPath } from "@/lib/tr/paths";

/**
 * Keeps the push service worker registered while the panel is used, and
 * handles notification clicks → Siparişler.
 */
export function TrPanelSwBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void registerOwnerPushServiceWorker().catch(() => {
      /* ignore — push optional until enabled */
    });

    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; url?: string }
        | null
        | undefined;
      if (!data || data.type !== "tr-panel-open-siparisler") return;
      const path =
        typeof data.url === "string" && data.url.startsWith("/tr/panel")
          ? data.url
          : trPanelOrdersPath();
      router.push(path);
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [router]);

  return null;
}
