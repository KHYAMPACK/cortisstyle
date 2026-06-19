import type { ResolvedStyleGuide } from "@/types/style-guide";

interface GuidePageOneViewProps {
  guide: ResolvedStyleGuide;
  compact?: boolean;
}

export function GuidePageOneView({ guide, compact = false }: GuidePageOneViewProps) {
  const { pageOne } = guide;
  const labelClass = compact
    ? "text-[5px] tracking-[0.28em] text-neutral-500 uppercase"
    : "text-[6px] tracking-[0.32em] text-neutral-500 uppercase";
  const valueClass = compact
    ? "text-[5.5px] leading-snug text-neutral-200"
    : "text-[6.5px] leading-snug text-neutral-200";
  const itemGap = compact ? "space-y-2.5" : "space-y-3";
  const itemPad = compact ? "pt-2" : "pt-2.5";

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-neutral-200">
      <header className="border-b border-neutral-800 px-3 py-2.5 md:px-4">
        <p className="font-serif text-[8px] leading-tight tracking-[0.06em] text-neutral-100 uppercase md:text-[9px]">
          {pageOne.title}
        </p>
        <p className="mt-1 text-[5.5px] tracking-[0.35em] text-neutral-500 uppercase">
          {pageOne.subtitle}
        </p>
        <p className="mt-2 border-t border-neutral-800 pt-2 text-[5px] tracking-[0.22em] text-neutral-600 uppercase">
          {pageOne.metadataLine}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2 md:px-4 md:py-2.5">
        <div className={itemGap}>
        {pageOne.directoryItems.map((item) => (
          <article
            key={item.itemId}
            className={`border-t border-neutral-800 ${itemPad}`}
          >
            <p className={labelClass}>Item Type</p>
            <p className={`mt-0.5 font-serif text-[7px] tracking-[0.08em] text-neutral-100 uppercase`}>
              {item.itemType}
            </p>

            <p className={`mt-1.5 ${labelClass}`}>Brand &amp; Model</p>
            <p className={`mt-0.5 ${valueClass}`}>{item.brandModel}</p>

            <p className={`mt-1.5 ${labelClass}`}>Action</p>
            <a
              href={item.shopUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-block text-[5.5px] tracking-[0.15em] text-neutral-300 underline decoration-neutral-700 underline-offset-2 uppercase"
            >
              Shop Source →
            </a>

            <p className={`mt-1.5 ${labelClass}`}>Pro-Proportion Tip</p>
            <p className={`mt-0.5 ${valueClass}`}>{item.proportionTip}</p>

            <p className={`mt-1.5 ${labelClass}`}>Budget Alternative</p>
            <p className={`mt-0.5 ${valueClass}`}>{item.budgetAlternative}</p>
          </article>
        ))}
        </div>
      </div>
    </div>
  );
}
