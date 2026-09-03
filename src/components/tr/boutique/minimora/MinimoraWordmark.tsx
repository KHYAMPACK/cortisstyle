import { Nunito } from "next/font/google";

const minimoraWordmarkFont = Nunito({
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
});

interface MinimoraWordmarkProps {
  className?: string;
}

/** Lowercase rounded wordmark in the logo pastel orange. */
export function MinimoraWordmark({ className = "" }: MinimoraWordmarkProps) {
  return (
    <span
      className={`${minimoraWordmarkFont.className} text-[1.6rem] leading-none font-extrabold tracking-[-0.04em] text-[#F3A575] lowercase md:text-[1.85rem] ${className}`}
    >
      minimora
    </span>
  );
}
