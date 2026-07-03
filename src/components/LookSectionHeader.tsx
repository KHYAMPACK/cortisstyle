import { tikTokProfileUrl } from "@/lib/tiktokCredit";
import type { LookCategoryDefinition } from "@/lib/dynamicLooks/types";

interface LookSectionHeaderProps {
  category: LookCategoryDefinition;
  id: string;
}

export function LookSectionHeader({ category, id }: LookSectionHeaderProps) {
  const isCreator = category.type === "creator";

  return (
    <div id={id} className="scroll-mt-28 px-4 pt-10 pb-4 md:px-5">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-blueprint-border" aria-hidden />

        <h3 className="shrink-0 font-serif text-[10px] tracking-[0.4em] text-neutral-500 uppercase md:text-[11px]">
          {isCreator ? `By ${category.label}` : category.label}
        </h3>

        <div className="h-px flex-1 bg-blueprint-border" aria-hidden />

        {isCreator && category.tiktokHandle && (
          <a
            href={tikTokProfileUrl(category.tiktokHandle)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-meta shrink-0 text-[8px] tracking-[0.16em] uppercase transition-colors hover:text-jet-black md:text-[9px]"
          >
            TikTok
          </a>
        )}
      </div>
    </div>
  );
}
