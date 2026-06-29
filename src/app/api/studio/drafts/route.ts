import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import {
  createStudioDraft,
  listStudioDraftsForUser,
} from "@/lib/studioDraftDb";
import { isValidLookId, normalizeDraftPayload } from "@/types/studioDraft";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    try {
      const drafts = await listStudioDraftsForUser(
        authResult.auth.supabase,
        authResult.auth.user.id,
      );

      return Response.json({ drafts });
    } catch (error) {
      console.error("[studio/drafts] list failed:", error);
      return Response.json({ error: "Unable to load drafts." }, { status: 500 });
    }
  });
}

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

    const record = body as { payload?: unknown; title?: string | null };
    const payload = normalizeDraftPayload(record.payload);

    if (!payload) {
      return Response.json(
        { error: "A valid draft payload is required." },
        { status: 400 },
      );
    }

    if (!isValidLookId(payload.lookId)) {
      return Response.json({ error: "Invalid lookId in payload." }, { status: 400 });
    }

    try {
      const draft = await createStudioDraft(
        authResult.auth.supabase,
        authResult.auth.user.id,
        payload,
        record.title,
      );

      return Response.json({ draft }, { status: 201 });
    } catch (error) {
      console.error("[studio/drafts] create failed:", error);
      return Response.json({ error: "Unable to create draft." }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
