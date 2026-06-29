import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MAINTENANCE_PATH } from "@/lib/launchGates";
import { handleStudioPreflight } from "@/lib/studioApiCors";
import {
  WARDROBE_APP_PATH,
  WARDROBE_COMING_SOON_PATH,
} from "@/lib/wardrobeGate";

const STUDIO_API_PREFIX = "/api/studio";

function isStudioApiPath(pathname: string): boolean {
  return pathname.startsWith(STUDIO_API_PREFIX);
}

function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

function isAllowedDuringMaintenance(pathname: string): boolean {
  if (pathname === MAINTENANCE_PATH || pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/studio") || pathname.startsWith("/auth/reset-password")) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
