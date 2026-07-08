import { isTrAdminAuthorized } from "@/lib/tr/adminAuth";
import { setBoutiqueOwnerAdmin } from "@/lib/tr/boutiques";

export const runtime = "nodejs";

/**
 * PATCH /api/tr/admin/boutiques/[id]/owner
 * Authorization: Bearer {TR_ADMIN_SECRET}
 * Body: { ownerUserId: string | null }
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  let body: { ownerUserId?: string | null };
  try {
    body = (await request.json()) as { ownerUserId?: string | null };
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ownerUserId =
    typeof body.ownerUserId === "string" && body.ownerUserId.trim()
      ? body.ownerUserId.trim()
      : body.ownerUserId === null
        ? null
        : undefined;

  if (ownerUserId === undefined) {
    return Response.json(
      { error: "ownerUserId (string or null) is required." },
      { status: 400 },
    );
  }

  try {
    const boutique = await setBoutiqueOwnerAdmin(id, ownerUserId);
    return Response.json({
      boutique: {
        id: boutique.id,
        slug: boutique.slug,
        name: boutique.name,
        ownerUserId: boutique.ownerUserId,
      },
    });
  } catch (error) {
    console.error("[tr/admin/boutiques/owner] failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to set owner.",
      },
      { status: 500 },
    );
  }
}
