import { trackPurchaseIntent } from "@/lib/purchaseIntentDb";

export const runtime = "nodejs";

interface PurchaseIntentPayload {
  lookId?: string;
}

export async function POST(request: Request) {
  let payload: PurchaseIntentPayload;

  try {
    payload = (await request.json()) as PurchaseIntentPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const lookId = payload.lookId?.trim();
  if (!lookId) {
    return Response.json({ error: "lookId is required." }, { status: 400 });
  }

  const result = await trackPurchaseIntent(lookId);

  if (result.ok) {
    return Response.json({ ok: true });
  }

  if (result.code === "config") {
    return Response.json({ ok: true, tracked: false }, { status: 202 });
  }

  return Response.json({ error: "Unable to track purchase intent." }, { status: 500 });
}
