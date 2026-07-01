import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import { registerStudioImportCache } from "@/lib/studioImportCacheDb";
import {
  isStudioImportPipeline,
  isValidSourceHash,
} from "@/types/studioImportCache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const record = body as {
      sourceHash?: string;
      pipeline?: string;
      assetUrl?: string;
      storagePath?: string;
      productName?: string | null;
      category?: string | null;
      brand?: string | null;
      itemIdSlug?: string;
      width?: number;
      height?: number;
      sourceUrl?: string | null;
      sourceFilename?: string | null;
    };

    const sourceHash = record.sourceHash?.trim().toLowerCase() ?? "";
    const pipeline = record.pipeline?.trim() ?? "";
    const assetUrl = record.assetUrl?.trim() ?? "";
    const storagePath = record.storagePath?.trim() ?? "";
    const itemIdSlug = record.itemIdSlug?.trim() ?? "";
    const width = record.width ?? 0;
    const height = record.height ?? 0;

    if (!isValidSourceHash(sourceHash)) {
      return Response.json({ error: "A valid sourceHash is required." }, { status: 400 });
    }

    if (!isStudioImportPipeline(pipeline)) {
      return Response.json(
        { error: "pipeline must be segmented or raw." },
        { status: 400 },
      );
    }

    if (!assetUrl || !storagePath || !itemIdSlug) {
      return Response.json(
        { error: "assetUrl, storagePath, and itemIdSlug are required." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return Response.json({ error: "width and height must be positive numbers." }, { status: 400 });
    }

    try {
      const cached = await registerStudioImportCache(
        authResult.auth.supabase,
        authResult.auth.user.id,
        {
          sourceHash,
          pipeline,
          assetUrl,
          storagePath,
          productName: record.productName ?? null,
          category: record.category ?? null,
          brand: record.brand ?? null,
          itemIdSlug,
          width,
          height,
          sourceUrl: record.sourceUrl ?? null,
          sourceFilename: record.sourceFilename ?? null,
        },
      );

      return Response.json({ record: cached }, { status: 201 });
    } catch (error) {
      console.error("[studio/imports/register] failed:", error);
      return Response.json({ error: "Unable to register import cache." }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
