import {
  deleteCampaign,
  getCampaign,
  updateCampaign,
} from "@/lib/tr/catalog/discountCampaigns";
import { discountCampaignErrorResponse } from "@/lib/tr/catalog/discountCampaignApi";
import { readCampaignBody } from "@/lib/tr/discounts/campaignRules";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Load the campaign and check the signed-in owner owns its boutique. */
async function loadOwned(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return { response: authResult.response } as const;

  const { id } = await context.params;
  const campaign = await getCampaign(id);
  if (!campaign || !requireOwnedBoutique(authResult.auth, campaign.boutiqueId)) {
    return {
      response: Response.json({ error: "Kampanya bulunamadı." }, { status: 404 }),
    } as const;
  }
  return { campaign } as const;
}

/** GET /api/tr/owner/discount-campaigns/[id] */
export async function GET(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;
  return Response.json({ campaign: loaded.campaign });
}

/** PATCH /api/tr/owner/discount-campaigns/[id] — full replace of the editable fields. */
export async function PATCH(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  let input;
  try {
    input = readCampaignBody(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Kampanya geçersiz." },
      { status: 400 },
    );
  }

  try {
    const campaign = await updateCampaign(loaded.campaign.id, input);
    return Response.json({ campaign });
  } catch (error) {
    return discountCampaignErrorResponse(error, "Kampanya güncellenemedi.");
  }
}

/** DELETE /api/tr/owner/discount-campaigns/[id] */
export async function DELETE(request: Request, context: RouteContext) {
  const loaded = await loadOwned(request, context);
  if ("response" in loaded) return loaded.response;

  try {
    await deleteCampaign(loaded.campaign.id);
    return Response.json({ ok: true });
  } catch (error) {
    return discountCampaignErrorResponse(error, "Kampanya silinemedi.");
  }
}
