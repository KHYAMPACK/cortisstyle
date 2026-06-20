import type { ResolvedStyleGuide } from "@/types/style-guide";
import { GuideDirectoryItemRow } from "@/components/guide/GuideDirectoryItemRow";

interface GuidePageOneViewProps {
  guide: ResolvedStyleGuide;
  compact?: boolean;
  blurred?: boolean;
}

export function GuidePageOneView({
  guide,
  compact = false,
  blurred = false,
}: GuidePageOneViewProps) {
  const { pageOne } = guide;
  const softBlur = blurred ? "blur-[1px] select-none" : "";
  const midBlur = blurred ? "blur-[2px] select-none" : "";

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-neutral-200">
      <header className="border-b border-neutral-800 px-3 py-2.5 md:px-4">
        <p
          className={`font-serif text-[8px] leading-tight tracking-[0.06em] text-neutral-100 uppercase md:text-[9px] ${softBlur}`}
        >
          {pageOne.title}
        </p>
        <p
          className={`mt-1 text-[5.5px] tracking-[0.35em] text-neutral-500 uppercase ${softBlur}`}
        >
          {pageOne.subtitle}
        </p>
        <p
          className={`mt-2 border-t border-neutral-800 pt-2 text-[5px] tracking-[0.22em] text-neutral-600 uppercase ${midBlur}`}
        >
          {pageOne.metadataLine}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2 md:px-4 md:py-2.5">
        {pageOne.directoryItems.map((item) => (
          <GuideDirectoryItemRow
            key={item.itemId}
            item={item}
            compact={compact}
            blurred={blurred}
          />
        ))}
      </div>
    </div>
  );
}
