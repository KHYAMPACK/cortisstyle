import { timingSafeEqual } from "node:crypto";

export function isTrAdminAuthorized(request: Request): boolean {
  const secret = process.env.TR_ADMIN_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = header.slice("Bearer ".length).trim();
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
