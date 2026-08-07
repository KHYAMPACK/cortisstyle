import { getTrVapidPublicKey } from "@/lib/tr/pushNotify";

export const runtime = "nodejs";

/**
 * GET /api/tr/owner/push/vapid-public-key
 */
export async function GET() {
  const publicKey = getTrVapidPublicKey();
  return Response.json({ publicKey });
}
