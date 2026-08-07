import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  deleteOwnerPushSubscriptionForOwner,
  upsertOwnerPushSubscription,
} from "@/lib/tr/pushSubscriptions";

export const runtime = "nodejs";

type SubscribeBody = {
  boutiqueId?: string;
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/**
 * POST /api/tr/owner/push/subscribe
 */
export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const boutiqueId = body.boutiqueId?.trim() ?? "";
  const endpoint = body.endpoint?.trim() ?? "";
  const p256dh = body.keys?.p256dh?.trim() ?? "";
  const auth = body.keys?.auth?.trim() ?? "";

  if (!boutiqueId || !endpoint || !p256dh || !auth) {
    return Response.json(
      { error: "boutiqueId, endpoint ve keys zorunlu." },
      { status: 400 },
    );
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  try {
    const subscription = await upsertOwnerPushSubscription({
      boutiqueId: boutique.id,
      ownerUserId: authResult.auth.user.id,
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get("user-agent"),
    });
    return Response.json({ ok: true, id: subscription.id });
  } catch (error) {
    console.error("[tr/owner/push/subscribe] POST failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Abonelik kaydedilemedi.",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tr/owner/push/subscribe
 */
export async function DELETE(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const boutiqueId = body.boutiqueId?.trim() ?? "";
  const endpoint = body.endpoint?.trim() ?? "";

  if (!boutiqueId || !endpoint) {
    return Response.json(
      { error: "boutiqueId ve endpoint zorunlu." },
      { status: 400 },
    );
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  try {
    await deleteOwnerPushSubscriptionForOwner({
      boutiqueId: boutique.id,
      ownerUserId: authResult.auth.user.id,
      endpoint,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[tr/owner/push/subscribe] DELETE failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Abonelik kaldırılamadı.",
      },
      { status: 500 },
    );
  }
}
