import type { ResolvedStyleGuide } from "@/types/style-guide";

interface GuidePageTwoViewProps {
  guide: ResolvedStyleGuide;
  compact?: boolean;
  blurred?: boolean;
}

export function GuidePageTwoView({
  guide,
  compact = false,
  blurred = false,
}: GuidePageTwoViewProps) {
  const { pageTwo } = guide;
  const labelClass = compact
    ? "text-[5px] tracking-[0.28em] text-neutral-500 uppercase"
    : "text-[6px] tracking-[0.32em] text-neutral-500 uppercase";
  const bodyClass = compact
    ? "text-[5.5px] leading-snug text-neutral-300"
    : "text-[6.5px] leading-snug text-neutral-300";
  const softBlur = blurred ? "blur-[1px] select-none" : "";
  const midBlur = blurred ? "blur-[2.5px] select-none" : "";
  const heavyBlur = blurred ? "blur-[4px] select-none" : "";
  const issueSerial = blurred ? "XXXX / 1000" : pageTwo.issueSerial;

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-neutral-200">
      <header className="border-b border-neutral-800 px-3 py-2.5 md:px-4">
        <p className="text-[5px] tracking-[0.35em] text-neutral-600 uppercase">
          Cortis Style — Digital Vault
        </p>
        <p
          className={`mt-1.5 font-serif text-[7px] leading-tight tracking-[0.05em] text-neutral-100 uppercase md:text-[8px] ${softBlur}`}
        >
          {pageTwo.vaultTitle}
        </p>
        <p
          className={`mt-2 font-mono text-[5px] tracking-[0.22em] text-neutral-500 uppercase ${midBlur}`}
        >
          {`ISSUE NO. ${issueSerial} // STATUS: ${pageTwo.status}`}
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-2 md:px-4 md:py-3">
        <section>
          <p className={labelClass}>Wardrobe Asset Receipt</p>
          <ul className="mt-1.5 space-y-1">
            {pageTwo.ledgerAssets.map((asset) => (
              <li key={asset} className={`${bodyClass} font-mono ${heavyBlur}`}>
                {asset}
              </li>
            ))}
          </ul>
          <p className={`mt-2 ${labelClass}`}>Ledger Logged</p>
          <p className={`mt-0.5 font-mono ${bodyClass} ${midBlur}`}>
            LEDGER LOGGED: {blurred ? "[ TIMESTAMP REDACTED ]" : pageTwo.ledgerTimestamp}
          </p>
        </section>

        <section className="border-t border-neutral-800 pt-2.5">
          <p className={labelClass}>Outfit Rarity Authentication</p>
          <p className={`mt-1 font-mono ${bodyClass} ${midBlur}`}>
            {`[ ${pageTwo.outfitRarityLabel} // SCORE: ${pageTwo.outfitRarityScore}/5 ]`}
          </p>
        </section>

        <section className="border-t border-neutral-800 pt-2.5">
          <p className={labelClass}>{pageTwo.synergySectionTitle}</p>
          <p className={`mt-1 ${bodyClass} ${midBlur}`}>{pageTwo.synergyStat}</p>

          <div className="mt-2.5 border border-neutral-700 bg-[#111111] p-2">
            <div
              aria-hidden
              className={`mx-auto grid h-14 w-14 grid-cols-5 grid-rows-5 gap-px border border-neutral-600 bg-neutral-900 p-1 ${blurred ? "opacity-40 blur-[2px]" : ""}`}
            >
              {Array.from({ length: 25 }).map((_, index) => (
                <span
                  key={index}
                  className={`${
                    [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 22, 24].includes(
                      index,
                    )
                      ? "bg-neutral-100"
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <p
              className={`mt-2 text-center text-[5px] leading-relaxed text-neutral-500 italic ${heavyBlur}`}
            >
              {pageTwo.qrSubtext}
            </p>
          </div>
        </section>
      </div>

      <footer className="border-t border-neutral-800 px-3 py-2 md:px-4">
        <p
          className={`text-center text-[5px] tracking-[0.25em] text-neutral-600 italic ${softBlur}`}
        >
          &ldquo;{pageTwo.closingQuote}&rdquo;
        </p>
      </footer>
    </div>
  );
}
