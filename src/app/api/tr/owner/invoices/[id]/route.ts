import {
  requireOwnedBoutique,
  requireTrOwner,
} from "@/lib/tr/ownerAuth";
import {
  getInvoiceByIdAdmin,
  updateInvoiceAdmin,
} from "@/lib/tr/invoices";
import type { TrInvoiceStatus } from "@/types/tr-marketplace";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const STATUSES: TrInvoiceStatus[] = ["draft", "issued_offline", "void"];

/**
 * PATCH /api/tr/owner/invoices/[id]
 * { boutiqueId, status?, externalInvoiceNo?, notes? }
 */
export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTrOwner(request);
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
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
    return Response.json(
      { error: "Bu butik için yetkiniz yok." },
      { status: 403 },
    );
  }

  const existing = await getInvoiceByIdAdmin(id);
  if (!existing || existing.boutiqueId !== boutique.id) {
    return Response.json({ error: "Fatura bulunamadı." }, { status: 404 });
  }

  const statusRaw = body.status;
  const status =
    typeof statusRaw === "string" &&
    STATUSES.includes(statusRaw as TrInvoiceStatus)
      ? (statusRaw as TrInvoiceStatus)
      : undefined;

  const externalInvoiceNo =
    body.externalInvoiceNo === undefined
      ? undefined
      : body.externalInvoiceNo === null
        ? null
        : typeof body.externalInvoiceNo === "string"
          ? body.externalInvoiceNo
          : undefined;

  const notes =
    body.notes === undefined
      ? undefined
      : body.notes === null
        ? null
        : typeof body.notes === "string"
          ? body.notes
          : undefined;

  if (
    status === undefined &&
    externalInvoiceNo === undefined &&
    notes === undefined
  ) {
    return Response.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  try {
    const invoice = await updateInvoiceAdmin(id, {
      status,
      externalInvoiceNo,
      notes,
    });
    return Response.json({ invoice });
  } catch (error) {
    console.error("[tr/owner/invoices/[id]] patch failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Fatura güncellenemedi.",
      },
      { status: 500 },
    );
  }
}
