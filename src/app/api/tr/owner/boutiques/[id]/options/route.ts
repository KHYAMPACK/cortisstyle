import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  getBoutiqueByIdAdmin,
  updateBoutiqueOptionPresetsAdmin,
} from "@/lib/tr/boutiques";
import {
  resolveBoutiqueColorPresets,
  resolveBoutiqueSizePresets,
} from "@/lib/tr/productOptions";
import type { TrProductColor } from "@/types/tr-marketplace";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function readColors(value: unknown): TrProductColor[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const hex = typeof record.hex === "string" ? record.hex.trim() : "";
      if (!name || !hex) return null;
      return { name, hex };
    })
    .filter((entry): entry is TrProductColor => entry !== null);
}

function readStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

/**
 * GET /api/tr/owner/boutiques/[id]/options
 * PATCH /api/tr/owner/boutiques/[id]/options — size/color presets
 */
export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = requireOwnedBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  const boutique = await getBoutiqueByIdAdmin(id);
  if (!boutique) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  return Response.json({
    sizePresets: resolveBoutiqueSizePresets(boutique.sizePresets),
    colorPresets: resolveBoutiqueColorPresets(boutique.colorPresets),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const owned = requireOwnedBoutique(authResult.auth, id);
  if (!owned) {
    return Response.json({ error: "Butik bulunamadı." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  try {
    const boutique = await updateBoutiqueOptionPresetsAdmin(id, {
      sizePresets: readStringArray(body.sizePresets),
      colorPresets: readColors(body.colorPresets),
    });

    return Response.json({
      sizePresets: resolveBoutiqueSizePresets(boutique.sizePresets),
      colorPresets: resolveBoutiqueColorPresets(boutique.colorPresets),
    });
  } catch (error) {
    console.error("[tr/owner/boutiques/options] patch failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Seçenekler kaydedilemedi.",
      },
      { status: 500 },
    );
  }
}
