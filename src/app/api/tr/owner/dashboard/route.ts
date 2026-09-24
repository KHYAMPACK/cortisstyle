import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import {
  DEFAULT_DASHBOARD_RANGE,
  isDashboardRangeId,
  resolveDashboardWindow,
} from "@/lib/tr/panel/dashboardRange";
import { getOwnerDashboard } from "@/lib/tr/panel/ownerDashboard";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/dashboard?boutiqueId=&range=&from=&to=
 * `from` / `to` (YYYY-MM-DD, Istanbul) are only read for range=custom.
 */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const boutiqueId = searchParams.get("boutiqueId")?.trim() ?? "";
  if (!boutiqueId) {
    return Response.json({ error: "boutiqueId zorunlu." }, { status: 400 });
  }

  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const rangeParam = searchParams.get("range")?.trim() ?? DEFAULT_DASHBOARD_RANGE;
  if (!isDashboardRangeId(rangeParam)) {
    return Response.json({ error: "Geçersiz tarih aralığı." }, { status: 400 });
  }

  const resolved = resolveDashboardWindow({
    range: rangeParam,
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    nowMs: Date.now(),
  });
  if (!resolved.ok) {
    return Response.json({ error: resolved.error }, { status: 400 });
  }

  try {
    const dashboard = await getOwnerDashboard({
      boutiqueId: boutique.id,
      window: resolved.window,
      offersCardPayments: await boutiqueOffersIyzicoCheckout(boutique.slug),
    });
    return Response.json({ dashboard });
  } catch (error) {
    console.error("[tr/owner/dashboard] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Özet yüklenemedi.",
      },
      { status: 500 },
    );
  }
}
