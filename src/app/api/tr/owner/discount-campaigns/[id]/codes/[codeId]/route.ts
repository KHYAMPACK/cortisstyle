import { getCampaign } from "@/lib/tr/catalog/discountCampaigns";
import { discountCampaignErrorResponse } from "@/lib/tr/catalog/discountCampaignApi";
import { deleteCampaignCode, getCampaignCode } from "@/lib/tr/catalog/discountCampaignCodes";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string; codeId: string }>;
}

/** DELETE /api/tr/owner/discount-campaigns/[id]/codes/[codeId] */
export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id, codeId } = await context.params;
  const campaign = await getCampaign(id);
  if (!campaign || !requireOwnedBoutique(authResult.auth, campaign.boutiqueId)) {
    return Response.json({ error: "Kampanya bulunamadı." }, { status: 404 });
  }
  const code = await getCampaignCode(codeId);
  if (!code || code.campaignId !== campaign.id) {
    return Response.json({ error: "Kupon bulunamadı." }, { status: 404 });
  }

  try {
    await deleteCampaignCode(codeId);
    return Response.json({ ok: true });
  } catch (error) {
    return discountCampaignErrorResponse(error, "Kupon silinemedi.");
  }
}
