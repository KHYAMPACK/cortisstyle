import type { CanvasItemLayout } from "@/types/canvas-layout";
import { stripLegacyModelLayers } from "@/lib/canvasLayout";
import { persistCanvasLayoutsForLook } from "@/lib/dynamicLooks/persistCanvasLayouts";

export const runtime = "nodejs";

const LOOK_ID_PATTERN = /^look-[a-z0-9-]+$/;

interface SaveCanvasLayoutPayload {
  lookId?: string;
  layouts?: Record<string, CanvasItemLayout>;
}

function isDevRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== "development") return false;

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export async function POST(request: Request) {
  if (!isDevRequest(request)) {
    return Response.json(
      { error: "Canvas layout sync is only available in local development." },
      { status: 403 },
    );
  }

  let payload: SaveCanvasLayoutPayload;

  try {
    payload = (await request.json()) as SaveCanvasLayoutPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const lookId = payload.lookId?.trim();
  const layouts = payload.layouts;

  if (!lookId || !LOOK_ID_PATTERN.test(lookId)) {
    return Response.json(
      { error: 'A valid lookId is required (e.g. "look-01").' },
      { status: 400 },
    );
  }

  if (!layouts || typeof layouts !== "object" || Array.isArray(layouts)) {
    return Response.json(
      { error: "layouts must be an object keyed by canvas item id." },
      { status: 400 },
    );
  }

  const cleanedLayouts = stripLegacyModelLayers(layouts);
  const file = await persistCanvasLayoutsForLook(lookId, cleanedLayouts);

  if (!file) {
    return Response.json(
      { error: `No dynamic look JSON found for "${lookId}".` },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    lookId,
    file,
  });
}
