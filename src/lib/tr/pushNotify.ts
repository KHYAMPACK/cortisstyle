import { formatTryFromKurus } from "@/types/tr-marketplace";
import {
  deleteOwnerPushSubscriptionByEndpoint,
  listOwnerPushSubscriptionsByBoutique,
} from "@/lib/tr/pushSubscriptions";

function getVapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} | null {
  const publicKey =
    process.env.TR_VAPID_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TR_VAPID_PUBLIC_KEY?.trim() ||
    "";
  const privateKey = process.env.TR_VAPID_PRIVATE_KEY?.trim() || "";
  const subject =
    process.env.TR_VAPID_SUBJECT?.trim() || "mailto:ops@cortisstyle.com";

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function getTrVapidPublicKey(): string | null {
  const key =
    process.env.NEXT_PUBLIC_TR_VAPID_PUBLIC_KEY?.trim() ||
    process.env.TR_VAPID_PUBLIC_KEY?.trim() ||
    "";
  return key || null;
}

export async function notifyBoutiqueOwnersOfNewOrder(input: {
  boutiqueId: string;
  orderId: string;
  customerName: string;
  totalKurus: number;
}): Promise<void> {
  const vapid = getVapidConfig();
  if (!vapid) {
    return;
  }

  let subscriptions;
  try {
    subscriptions = await listOwnerPushSubscriptionsByBoutique(input.boutiqueId);
  } catch (error) {
    console.error("[tr/pushNotify] list subscriptions failed:", error);
    return;
  }

  if (subscriptions.length === 0) return;

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch (error) {
    console.error("[tr/pushNotify] web-push import failed:", error);
    return;
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const payload = JSON.stringify({
    title: "Yeni sipariş",
    body: `${input.customerName} · ${formatTryFromKurus(input.totalKurus)}`,
    url: "/tr/panel/siparisler",
    data: { url: "/tr/panel/siparisler", orderId: input.orderId },
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (error) {
        const statusCode =
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          typeof (error as { statusCode: unknown }).statusCode === "number"
            ? (error as { statusCode: number }).statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          try {
            await deleteOwnerPushSubscriptionByEndpoint(sub.endpoint);
          } catch (deleteError) {
            console.error(
              "[tr/pushNotify] prune endpoint failed:",
              deleteError,
            );
          }
          return;
        }

        console.error("[tr/pushNotify] send failed:", error);
      }
    }),
  );
}

/** Fire-and-forget; never throws to callers. */
export function notifyBoutiqueOwnersOfNewOrderSafe(
  input: Parameters<typeof notifyBoutiqueOwnersOfNewOrder>[0],
): void {
  void notifyBoutiqueOwnersOfNewOrder(input).catch((error) => {
    console.error("[tr/pushNotify] unexpected:", error);
  });
}
