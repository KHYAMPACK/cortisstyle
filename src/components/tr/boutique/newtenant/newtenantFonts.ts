import { Inter } from "next/font/google";

/**
 * Placeholder fonts — safe, neutral system-adjacent choice
 * (Inter) so the standalone shell renders correctly before real
 * brand type is chosen. Swap for the real display/body pairing
 * later, same shape as minimoraFonts.ts (one body + one display
 * variable, both exposed as CSS custom properties).
 */
export const newtenantBodyFont = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-newtenant-body",
});

export const newtenantDisplayFont = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-newtenant-display",
});
