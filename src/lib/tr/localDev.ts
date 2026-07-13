/**
 * Localhost-only gates (same pattern as save-canvas-layout).
 */

export function isLocalhostDevRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== "development") return false;

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export function isLocalDevProcess(): boolean {
  return process.env.NODE_ENV === "development";
}
