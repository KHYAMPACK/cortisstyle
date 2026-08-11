const SW_URL = "/tr-panel-sw.js";

export type OwnerPushStatus =
  | "unsupported"
  | "unconfigured"
  | "default"
  | "denied"
  | "subscribed"
  | "granted_unsubscribed";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isOwnerPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerOwnerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isOwnerPushSupported()) return null;
  // Root scope (SW lives at /tr-panel-sw.js) so the worker stays eligible for
  // background push even when no /tr/panel tab is open.
  const registration = await navigator.serviceWorker.register(SW_URL, {
    scope: "/",
    updateViaCache: "none",
  });
  await navigator.serviceWorker.ready;
  return registration;
}


async function fetchVapidPublicKey(): Promise<string | null> {
  const response = await fetch("/api/tr/owner/push/vapid-public-key");
  const data = (await response.json()) as {
    publicKey?: string | null;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "VAPID anahtarı alınamadı.");
  }
  return data.publicKey?.trim() || null;
}

export async function getOwnerPushStatus(
  boutiqueId: string,
): Promise<OwnerPushStatus> {
  void boutiqueId;
  if (!isOwnerPushSupported()) return "unsupported";

  const publicKey = await fetchVapidPublicKey().catch(() => null);
  if (!publicKey) return "unconfigured";

  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "default") return "default";

  const registration = await registerOwnerPushServiceWorker();
  if (!registration) return "unsupported";

  const existing = await registration.pushManager.getSubscription();
  return existing ? "subscribed" : "granted_unsubscribed";
}

export async function enableOwnerPush(input: {
  boutiqueId: string;
  accessToken: string;
}): Promise<void> {
  if (!isOwnerPushSupported()) {
    throw new Error("Bu cihaz bildirimleri desteklemiyor.");
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    throw new Error("Bildirimler henüz yapılandırılmadı.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Bildirim izni verilmedi.");
  }

  const registration = await registerOwnerPushServiceWorker();
  if (!registration) {
    throw new Error("Servis çalışanı kaydedilemedi.");
  }

  await navigator.serviceWorker.ready;

  // Prefer a fresh subscription after SW updates / scope changes.
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe().catch(() => undefined);
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    throw new Error("Abonelik bilgisi eksik.");
  }

  const response = await fetch("/api/tr/owner/push/subscribe", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      boutiqueId: input.boutiqueId,
      endpoint,
      keys: { p256dh, auth },
    }),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Abonelik kaydedilemedi.");
  }
}

export async function disableOwnerPush(input: {
  boutiqueId: string;
  accessToken: string;
}): Promise<void> {
  if (!isOwnerPushSupported()) return;

  const registration = await registerOwnerPushServiceWorker();
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => undefined);

    await fetch("/api/tr/owner/push/subscribe", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        boutiqueId: input.boutiqueId,
        endpoint,
      }),
    });
  }
}
