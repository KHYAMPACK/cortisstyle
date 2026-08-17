import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import { BasitKargoError } from "@/lib/tr/shipping/providers/basitKargo";
import { getBoutiqueShipmentLabelSvg } from "@/lib/tr/shipping/ownerShipment";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tr/owner/orders/[id]/shipment/label?boutiqueId=
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const boutiqueId =
    new URL(request.url).searchParams.get("boutiqueId")?.trim() ?? "";
  const boutique = requireOwnedBoutique(authResult.auth, boutiqueId);
  if (!boutique) {
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  try {
    const svg = await getBoutiqueShipmentLabelSvg(boutique, id);
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `inline; filename="kargo-${id.slice(0, 8)}.svg"`,
      },
    });
  } catch (error) {
    if (error instanceof BasitKargoError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    const message =
      error instanceof Error ? error.message : "Etiket alınamadı.";
    const status = message.includes("bulunamadı") ? 404 : 400;
    return Response.json({ error: message }, { status });
  }
}
