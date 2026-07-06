export function isTrAdminAuthorized(request: Request): boolean {
  const secret = process.env.TR_ADMIN_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  return header.slice("Bearer ".length).trim() === secret;
}
