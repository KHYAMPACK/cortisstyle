import { isLocalhostDevRequest } from "@/lib/tr/localDev";
import { normalizeOutfitCutout } from "@/lib/tr/outfitFrame/normalizeOutfitCutout";
import {
  deleteHeroSlotFile,
  listHeroSlotPublicPaths,
  writeNormalizedHeroSlot,
} from "@/lib/tr/outfitFrame/heroSlotFs";
import { removeGarmentBackground } from "@/lib/studioRemoveBg";
import type { OutfitFrameRole } from "@/lib/tr/outfitFrame/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function forbidden() {
  return Response.json(
    { error: "Hero import is only available on localhost in development." },
    { status: 403 },
  );
}

function parseRole(raw: FormDataEntryValue | null): "top" | "bottom" | null {
  if (typeof raw !== "string") return null;
  const role = raw.trim() as OutfitFrameRole;
  return role === "top" || role === "bottom" ? role : null;
}

function filenameFromSrc(src: string): string | null {
  const base = src.split("/").pop();
  if (!base || !base.toLowerCase().endsWith(".png")) return null;
  return base;
}

/** GET — current hero slot lists from disk. */
export async function GET(request: Request) {
  if (!isLocalhostDevRequest(request)) return forbidden();

  try {
    const lists = await listHeroSlotPublicPaths();
    return Response.json(lists);
  } catch (error) {
    console.error("[tr/dev/hero-import] list failed:", error);
    return Response.json({ error: "Failed to list hero slots." }, { status: 500 });
  }
}

/**
 * POST multipart: file + role=top|bottom + optional skipBg=1
 * Photoroom (unless skip) → waist-anchored normalize → write public + regenerate lists.
 */
export async function POST(request: Request) {
  if (!isLocalhostDevRequest(request)) return forbidden();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart payload." }, { status: 400 });
  }

  const role = parseRole(formData.get("role"));
  if (!role) {
    return Response.json({ error: "role must be top or bottom." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file is required." }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  if (!ALLOWED_TYPES.has(contentType)) {
    return Response.json(
      { error: "Only PNG, JPEG, and WebP are allowed." },
      { status: 400 },
    );
  }

  const skipBgRaw = formData.get("skipBg");
  const skipBg =
    skipBgRaw === "1" ||
    skipBgRaw === "true" ||
    skipBgRaw === "on";

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const cutout = skipBg
      ? bytes
      : await removeGarmentBackground({
          bytes,
          filename: file.name || "garment.jpg",
          mimeType: contentType,
        });

    const normalized = await normalizeOutfitCutout(cutout, role);
    const written = await writeNormalizedHeroSlot({
      role,
      filenameHint: file.name || `${role}.png`,
      png: normalized,
    });
    const lists = await listHeroSlotPublicPaths();

    return Response.json({
      ok: true,
      role,
      src: written.src,
      filename: written.filename,
      skipBg,
      tops: lists.tops,
      bottoms: lists.bottoms,
    });
  } catch (error) {
    console.error("[tr/dev/hero-import] import failed:", error);
    const message =
      error instanceof Error ? error.message : "Hero import failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

/** DELETE JSON: { role, src } or { role, filename } */
export async function DELETE(request: Request) {
  if (!isLocalhostDevRequest(request)) return forbidden();

  let body: { role?: string; src?: string; filename?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const role = parseRole(body.role ?? null);
  if (!role) {
    return Response.json({ error: "role must be top or bottom." }, { status: 400 });
  }

  const filename =
    body.filename?.trim() ||
    (body.src ? filenameFromSrc(body.src) : null);

  if (!filename) {
    return Response.json({ error: "filename or src required." }, { status: 400 });
  }

  try {
    await deleteHeroSlotFile({ role, filename });
    const lists = await listHeroSlotPublicPaths();
    return Response.json({ ok: true, tops: lists.tops, bottoms: lists.bottoms });
  } catch (error) {
    console.error("[tr/dev/hero-import] delete failed:", error);
    const message =
      error instanceof Error ? error.message : "Delete failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
