import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import { lookupStudioImportCache } from "@/lib/studioImportCacheDb";
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

    const record = body as { sourceHash?: string; pipeline?: string };
    const sourceHash = record.sourceHash?.trim().toLowerCase() ?? "";
    const pipeline = record.pipeline?.trim() ?? "";

    if (!isValidSourceHash(sourceHash)) {
      return Response.json({ error: "A valid sourceHash is required." }, { status: 400 });
    }

    if (!isStudioImportPipeline(pipeline)) {
      return Response.json(
        { error: "pipeline must be segmented or raw." },
        { status: 400 },
      );
    }

    try {
      const cached = await lookupStudioImportCache(
        authResult.auth.supabase,
        authResult.auth.user.id,
        sourceHash,
        pipeline,
      );

      if (!cached) {
        return Response.json({ hit: false });
      }

      return Response.json({ hit: true, record: cached });
    } catch (error) {
      console.error("[studio/imports/lookup] failed:", error);
      return Response.json({ error: "Unable to look up import cache." }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
