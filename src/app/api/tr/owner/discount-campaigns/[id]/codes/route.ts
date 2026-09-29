import { getCampaign } from "@/lib/tr/catalog/discountCampaigns";
import { discountCampaignErrorResponse } from "@/lib/tr/catalog/discountCampaignApi";
import {
  addCustomCode,
  addGeneratedCodes,
  listCampaignCodes,
} from "@/lib/tr/catalog/discountCampaignCodes";
import { readCustomCodeBody, readGenerateCodesBody } from "@/lib/tr/discounts/codeRules";
import { requireOwnedBoutique, requireTrOwner } from "@/lib/tr/ownerAuth";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Load the campaign, check ownership, and require it to be a `kind: 'code'` campaign. */
async function loadOwnedCodeCampaign(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return { response: authResult.response } as const;

  const { id } = await context.params;
  const campaign = await getCampaign(id);
  if (!campaign || !requireOwnedBoutique(authResult.auth, campaign.boutiqueId)) {
    return {
      response: Response.json({ error: "Kampanya bulunamadı." }, { status: 404 }),
    } as const;
  }
  if (campaign.kind !== "code") {
    return {
      response: Response.json(
        { error: "Kuponlar yalnızca indirim kodu kampanyalarında olur." },
        { status: 400 },
      ),
    } as const;
  }
  return { campaign } as const;
}

/** GET /api/tr/owner/discount-campaigns/[id]/codes */
export async function GET(request: Request, context: RouteContext) {
  const loaded = await loadOwnedCodeCampaign(request, context);
  if ("response" in loaded) return loaded.response;

  try {
    const codes = await listCampaignCodes(loaded.campaign.id);
    return Response.json({ codes });
  } catch (error) {
    return discountCampaignErrorResponse(error, "Kuponlar yüklenemedi.");
  }
}

/**
 * POST /api/tr/owner/discount-campaigns/[id]/codes
 * `{ mode: 'custom', code, usageLimitTotal?, usageLimitPerCustomer? }` — "Özel Kupon".
 * `{ mode: 'generate', prefix, count, usageLimitTotal?, usageLimitPerCustomer? }` — "Otomatik Kod Üret".
 */
export async function POST(request: Request, context: RouteContext) {
  const loaded = await loadOwnedCodeCampaign(request, context);
  if ("response" in loaded) return loaded.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  if (body.mode === "generate") {
    let input;
    try {
      input = readGenerateCodesBody(body);
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Kupon kodları geçersiz." },
        { status: 400 },
      );
    }
    try {
      const codes = await addGeneratedCodes(loaded.campaign.id, loaded.campaign.boutiqueId, input);
      return Response.json({ codes }, { status: 201 });
    } catch (error) {
      return discountCampaignErrorResponse(error, "Kupon kodları oluşturulamadı.");
    }
  }

  let input;
  try {
    input = readCustomCodeBody(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Kupon kodu geçersiz." },
      { status: 400 },
    );
  }
  try {
    const code = await addCustomCode(loaded.campaign.id, loaded.campaign.boutiqueId, input);
    return Response.json({ code }, { status: 201 });
  } catch (error) {
    return discountCampaignErrorResponse(error, "Kupon kodu oluşturulamadı.");
  }
}
