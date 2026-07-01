import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import { listStudioImportCache } from "@/lib/studioImportCacheDb";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 100;

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;

  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: Request) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    const limit = parseLimit(new URL(request.url).searchParams.get("limit"));

    try {
      const records = await listStudioImportCache(
        authResult.auth.supabase,
        authResult.auth.user.id,
        limit,
      );

      return Response.json({ records });
    } catch (error) {
      console.error("[studio/imports] list failed:", error);
      return Response.json({ error: "Unable to load import library." }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
