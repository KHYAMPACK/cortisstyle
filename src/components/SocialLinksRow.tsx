import { CORTIS_SOCIAL_LINKS } from "@/data/social";

interface SocialLinksRowProps {
  tone?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
}

export function SocialLinksRow({
  tone = "dark",
  align = "left",
  className = "",
}: SocialLinksRowProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={`flex items-center gap-6 font-mono text-[10px] tracking-widest ${
        align === "center" ? "justify-center" : ""
      } ${className}`.trim()}
    >
      {CORTIS_SOCIAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isDark
              ? "text-neutral-400 transition-colors hover:text-white"
              : "text-meta transition-colors hover:text-jet-black"
          }
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
