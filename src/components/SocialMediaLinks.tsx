import { CORTIS_SOCIAL_LINKS } from "@/data/social";

type SocialMediaLinksTone = "hero" | "dark" | "light";

interface SocialMediaLinksProps {
  tone?: SocialMediaLinksTone;
  className?: string;
}

function linkClassForTone(tone: SocialMediaLinksTone): string {
  if (tone === "hero") {
    return "border-b border-white/25 pb-0.5 text-white/75 transition-all duration-200 hover:border-white/60 hover:text-white";
  }
  if (tone === "dark") {
    return "border-b border-white/20 pb-0.5 text-white transition-all duration-200 hover:text-white md:text-neutral-200";
  }
  return "border-b border-neutral-300 pb-0.5 text-[#0D0D0D] transition-all duration-200 hover:text-[#0D0D0D]";
}

/** Compact horizontal social row — hero header strip, inline bars, etc. */
export function SocialMediaLinks({
  tone = "dark",
  className = "",
}: SocialMediaLinksProps) {
  return (
    <div
      className={`flex items-center gap-6 font-mono text-[10px] tracking-widest uppercase md:gap-8 md:text-[11px] ${className}`.trim()}
    >
      {CORTIS_SOCIAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassForTone(tone)}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
