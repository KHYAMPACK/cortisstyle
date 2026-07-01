import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import { touchStudioImportCacheById } from "@/lib/studioImportCacheDb";

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

    const id = (body as { id?: string }).id?.trim() ?? "";

    if (!id) {
      return Response.json({ error: "id is required." }, { status: 400 });
    }

    try {
      const record = await touchStudioImportCacheById(
        authResult.auth.supabase,
        authResult.auth.user.id,
        id,
      );

      if (!record) {
        return Response.json({ error: "Import not found." }, { status: 404 });
      }

      return Response.json({ record });
    } catch (error) {
      console.error("[studio/imports/use] failed:", error);
      return Response.json({ error: "Unable to update import record." }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
