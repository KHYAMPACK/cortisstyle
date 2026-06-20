import type { ResolvedStyleGuideDirectoryItem } from "@/types/style-guide";
import { GuideAssetPreviewBox } from "@/components/guide/GuideAssetPreviewBox";
import { formatFitGuidanceLine } from "@/lib/guideFormat";

interface GuideDirectoryItemRowProps {
  item: ResolvedStyleGuideDirectoryItem;
  compact?: boolean;
  blurred?: boolean;
}

export function GuideDirectoryItemRow({
  item,
  compact = false,
  blurred = false,
}: GuideDirectoryItemRowProps) {
  const labelClass = compact
    ? "text-[4.5px] tracking-[0.28em] text-neutral-500 uppercase"
    : "text-[5px] tracking-[0.32em] text-neutral-500 uppercase";
  const metaClass = compact
    ? "text-[4.5px] leading-snug tracking-[0.08em] text-neutral-400"
    : "text-[5.5px] leading-snug tracking-[0.08em] text-neutral-400";
  const bodyClass = compact
    ? "text-[4.5px] leading-relaxed text-neutral-300"
    : "text-[5.5px] leading-relaxed text-neutral-300";
  const titleClass = compact
    ? "font-serif text-[6.5px] tracking-[0.1em] text-white uppercase"
    : "font-serif text-[8px] tracking-[0.1em] text-white uppercase";
  const brandClass = compact
    ? "font-serif text-[5.5px] tracking-[0.06em] text-neutral-200 uppercase"
    : "font-serif text-[7px] tracking-[0.06em] text-neutral-200 uppercase";
  const heavyBlur = blurred ? "blur-[4px] select-none" : "";
  const midBlur = blurred ? "blur-[2px] select-none" : "";
  const frameSize = compact ? 72 : 88;

  return (
    <article className="border-b border-neutral-800 py-2.5 md:py-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-[0.7]">
          <h3 className={`${titleClass} ${midBlur}`}>{item.itemType}</h3>
          <p className={`mt-0.5 ${brandClass} ${heavyBlur}`}>{item.brandModel}</p>

          <div className="mt-2">
            <p className={labelClass}>Actions</p>
            {blurred ? (
              <div className="mt-1 flex gap-1">
                <div className="h-3 flex-1 rounded-sm bg-neutral-700/80 blur-[2px]" />
                <div className="h-3 flex-1 rounded-sm bg-neutral-700/80 blur-[2px]" />
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1">
                <a
                  href={item.shopUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-neutral-700 px-1.5 py-0.5 text-[4px] tracking-[0.14em] text-neutral-200 uppercase transition-colors hover:border-neutral-500 hover:text-white"
                >
                  Shop Original Source
                </a>
                <a
                  href={item.budgetAlternativeLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-neutral-700 px-1.5 py-0.5 text-[4px] tracking-[0.14em] text-neutral-400 uppercase transition-colors hover:border-neutral-500 hover:text-neutral-200"
                >
                  Budget Alternative Direct Link
                </a>
              </div>
            )}
          </div>

          <div className="mt-2">
            <p className={labelClass}>Sizing &amp; Fit</p>
            <p className={`mt-0.5 ${metaClass} ${heavyBlur}`}>
              {formatFitGuidanceLine(item.fitGuidance)}
            </p>
          </div>

          <div className="mt-2">
            <p className={labelClass}>Styling &amp; Synergy</p>
            <p className={`mt-0.5 ${bodyClass} ${heavyBlur}`}>
              {item.stylingExecution.howToWear}
            </p>
            <p className={`mt-1 ${bodyClass} ${heavyBlur}`}>
              {item.stylingExecution.textureSynergy}
            </p>
          </div>

          <div className="mt-2">
            <p className={labelClass}>Resale Directory</p>
            <p className={`mt-0.5 ${bodyClass} ${heavyBlur}`}>
              Search Keywords: {item.resaleKeywords.tags}
            </p>
            <p className={`mt-1 ${metaClass} ${heavyBlur}`}>
              Est. Market Value: {item.resaleKeywords.estPriceRange}
            </p>
            {!blurred ? (
              <p className={`mt-1 ${metaClass}`}>
                Alt: {item.budgetAlternativeLink.name}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-[0.3] items-center justify-center">
          <GuideAssetPreviewBox
            imageSrc={item.canvasImage}
            alt={item.itemType}
            scaleFactor={item.assetScaleFactor}
            frameSize={frameSize}
            blurred={blurred}
          />
        </div>
      </div>
    </article>
  );
}
