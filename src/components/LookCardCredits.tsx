import type { MouseEvent } from "react";
import { resolveTikTokHandle, tikTokProfileUrl } from "@/lib/tiktokCredit";
import type { Look } from "@/types/look";

interface LookCardCreditsProps {
  look: Pick<Look, "vibe" | "modelName" | "tiktokHandle">;
  /** Stop card click when opening TikTok. */
  onTikTokClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function LookCardCredits({ look, onTikTokClick }: LookCardCreditsProps) {
  const handle = resolveTikTokHandle(look.tiktokHandle);
  const tiktokUrl = tikTokProfileUrl(handle);

  return (
    <div className="mt-2 flex items-end justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-meta text-[9px] tracking-[0.22em] uppercase">
          {look.vibe}
        </p>
        <p className="text-meta text-[9px] tracking-[0.28em] uppercase">
          By {look.modelName.trim()}
        </p>
      </div>

      <a
        href={tiktokUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onTikTokClick}
        className="text-meta shrink-0 text-right text-[8px] leading-snug tracking-[0.16em] uppercase transition-colors hover:text-jet-black md:text-[9px] md:tracking-[0.18em]"
      >
        TikTok // @{handle}
      </a>
    </div>
  );
}
