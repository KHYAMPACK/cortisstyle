import {
  createCampaign,
  listCampaigns,
} from "@/lib/tr/catalog/discountCampaigns";
import { discountCampaignErrorResponse } from "@/lib/tr/catalog/discountCampaignApi";
import { readCampaignBody } from "@/lib/tr/discounts/campaignRules";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

/** GET /api/tr/owner/discount-campaigns?boutiqueId= — the boutique's campaigns. */
export async function GET(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
  }

  try {
    const campaigns = await listCampaigns(boutique.id);
    return Response.json({ campaigns });
  } catch (error) {
    return discountCampaignErrorResponse(error, "Kampanyalar yüklenemedi.");
  }
}

/** POST /api/tr/owner/discount-campaigns — create a campaign. */
export async function POST(request: Request) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const boutiqueId =
    typeof body.boutiqueId === "string" ? body.boutiqueId.trim() : "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json({ error: "Bu butik için yetkiniz yok." }, { status: 403 });
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
    const campaign = await createCampaign(boutique.id, input);
    return Response.json({ campaign }, { status: 201 });
  } catch (error) {
    return discountCampaignErrorResponse(error, "Kampanya oluşturulamadı.");
  }
}
