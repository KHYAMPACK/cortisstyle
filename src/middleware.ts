import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MAINTENANCE_PATH } from "@/lib/launchGates";
import {
  WARDROBE_APP_PATH,
  WARDROBE_COMING_SOON_PATH,
} from "@/lib/wardrobeGate";

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

  if (isMaintenanceModeEnabled() && !isAllowedDuringMaintenance(pathname)) {
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
