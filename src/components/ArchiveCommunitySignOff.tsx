import { SocialMediaLinks } from "@/components/SocialMediaLinks";

interface ArchiveCommunitySignOffProps {
  tone?: "dark" | "light";
  className?: string;
}

export function ArchiveCommunitySignOff({
  tone = "dark",
  className = "",
}: ArchiveCommunitySignOffProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={`clear-both mt-16 flex w-full flex-col items-center justify-center gap-3 pb-12 ${className}`.trim()}
    >
      <span
        className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
          isDark ? "text-neutral-400" : "text-neutral-500"
        }`}
      >
        Connect with the Archive Community
      </span>
      <SocialMediaLinks tone={tone} className="justify-center" />
    </div>
  );
}
