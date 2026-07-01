import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MAINTENANCE_PATH } from "@/lib/launchGates";
import { handleStudioPreflight } from "@/lib/studioApiCors";
import {
  WARDROBE_APP_PATH,
  WARDROBE_COMING_SOON_PATH,
} from "@/lib/wardrobeGate";

const STUDIO_API_PREFIX = "/api/studio";
const STUDIO_APP_PREFIX = "/studio";

function isStudioApiPath(pathname: string): boolean {
  return pathname.startsWith(STUDIO_API_PREFIX);
}

function isStudioStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith(`${STUDIO_APP_PREFIX}/assets/`) ||
    pathname === `${STUDIO_APP_PREFIX}/favicon.svg` ||
    pathname === `${STUDIO_APP_PREFIX}/icons.svg`
  );
}

function shouldServeStudioSpa(pathname: string): boolean {
  if (!pathname.startsWith(STUDIO_APP_PREFIX)) return false;
  if (isStudioStaticAsset(pathname)) return false;
  if (pathname === STUDIO_APP_PREFIX || pathname === `${STUDIO_APP_PREFIX}/`) {
    return true;
  }
  if (pathname === `${STUDIO_APP_PREFIX}/index.html`) return false;
  return !/\.[a-z0-9]+$/i.test(pathname);
}

function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

function isAllowedDuringMaintenance(pathname: string): boolean {
  if (pathname === MAINTENANCE_PATH) {
    return true;
  }

  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/studio") ||
    pathname.startsWith("/auth/reset-password")
  ) {
    return true;
  }

  if (pathname.startsWith(STUDIO_APP_PREFIX)) {
    return true;
  }

  if (pathname.startsWith("/_next")) {
    return true;
  }

  if (pathname.startsWith("/brand/") || pathname.startsWith("/images/")) {
    return true;
  }

  if (pathname === "/icon.png" || pathname === "/apple-icon.png") {
    return true;
  }

  return /\.(?:png|jpe?g|webp|svg|ico|gif|woff2?)$/i.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStudioApiPath(pathname) && request.method === "OPTIONS") {
    const preflight = handleStudioPreflight(request);
    if (preflight) return preflight;
  }

  if (
    isMaintenanceModeEnabled() &&
    !isAllowedDuringMaintenance(pathname) &&
    !isStudioApiPath(pathname)
  ) {
    return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
  }

  if (process.env.NEXT_PUBLIC_WARDROBE_GATE_ENABLED === "true") {
    if (pathname === WARDROBE_APP_PATH) {
      return NextResponse.redirect(
        new URL(WARDROBE_COMING_SOON_PATH, request.url),
      );
    }
  }

  if (shouldServeStudioSpa(pathname)) {
    return NextResponse.rewrite(new URL("/studio/index.html", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
