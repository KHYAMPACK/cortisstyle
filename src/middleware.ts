import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  WARDROBE_APP_PATH,
  WARDROBE_COMING_SOON_PATH,
} from "@/lib/wardrobeGate";

export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_WARDROBE_GATE_ENABLED !== "true") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === WARDROBE_APP_PATH) {
    return NextResponse.redirect(
      new URL(WARDROBE_COMING_SOON_PATH, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/wardrobe"],
};
