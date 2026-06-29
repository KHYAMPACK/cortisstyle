import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import {
  getStudioDraftForUser,
  updateStudioDraft,
} from "@/lib/studioDraftDb";
import { isValidLookId, normalizeDraftPayload } from "@/types/studioDraft";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await context.params;

    try {
      const draft = await getStudioDraftForUser(
        authResult.auth.supabase,
        authResult.auth.user.id,
        id,
      );

      if (!draft) {
        return Response.json({ error: "Draft not found." }, { status: 404 });
      }

      return Response.json({ draft });
    } catch (error) {
      console.error("[studio/drafts/:id] get failed:", error);
      return Response.json({ error: "Unable to load draft." }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    const { id } = await context.params;

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
      const draft = await updateStudioDraft(
        authResult.auth.supabase,
        authResult.auth.user.id,
        id,
        payload,
        record.title,
      );

      if (!draft) {
        return Response.json({ error: "Draft not found." }, { status: 404 });
      }

      return Response.json({ draft });
    } catch (error) {
      console.error("[studio/drafts/:id] update failed:", error);
      return Response.json({ error: "Unable to update draft." }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
