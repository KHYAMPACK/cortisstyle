import { CertificateEmblem } from "@/components/guide/CertificateEmblem";
import { CertificateQrPlaceholder } from "@/components/guide/CertificateQrPlaceholder";
import type { ResolvedStyleGuide } from "@/types/style-guide";

interface GuidePageTwoViewProps {
  guide: ResolvedStyleGuide;
  compact?: boolean;
  blurred?: boolean;
}

function CornerCrosshair({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute font-mono text-[7px] leading-none text-white/35 ${className}`}
    >
      +
    </span>
  );
}

export function GuidePageTwoView({
  guide,
  compact = false,
  blurred = false,
}: GuidePageTwoViewProps) {
  const { pageTwo } = guide;
  const titleClass = compact
    ? "font-serif text-[7px] tracking-[0.32em] text-white uppercase"
    : "font-serif text-[10px] tracking-[0.38em] text-white uppercase";
  const subtitleClass = compact
    ? "text-[4.5px] tracking-[0.38em] text-neutral-500 uppercase"
    : "text-[6px] tracking-[0.42em] text-neutral-500 uppercase";
  const bodyClass = compact
    ? "text-[5px] leading-relaxed text-neutral-300"
    : "text-[6.5px] leading-relaxed text-neutral-300";
  const softBlur = blurred ? "blur-[1px] select-none" : "";
  const midBlur = blurred ? "blur-[2.5px] select-none" : "";
  const heavyBlur = blurred ? "blur-[4px] select-none" : "";

  const holderName = blurred ? "ARCHIVE MEMBER" : pageTwo.holderName;
  const serialLine = blurred
    ? `${pageTwo.archiveCode}-#XXXX/1000`
    : pageTwo.serialRegisterLine;
  const ledgerTimestamp = blurred
    ? "[ TIMESTAMP REDACTED ]"
    : pageTwo.ledgerTimestamp;

  return (
    <div className="flex h-full min-h-full flex-col bg-[#0a0a0a] p-2.5 text-neutral-200 md:p-3">
      <div className="relative flex min-h-full flex-1 flex-col border border-white/20 px-3 py-4 md:px-4 md:py-5">
        <CornerCrosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        <CornerCrosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
        <CornerCrosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
        <CornerCrosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

        <header className="text-center">
          <h1 className={`${titleClass} ${softBlur}`}>{pageTwo.certificateTitle}</h1>
          <p className={`mt-2 ${subtitleClass}`}>{pageTwo.certificateSubtitle}</p>
          <div className="mx-auto mt-3 h-px w-16 bg-neutral-800 md:w-24" />
        </header>

        <section className="mt-5 text-center md:mt-7">
          <p className="text-[4.5px] tracking-[0.32em] text-neutral-500 uppercase md:text-[5px]">
            This official digital asset is proudly issued and registered to:
          </p>
          <p
            className={`mt-2 font-serif text-[8px] tracking-[0.18em] text-white uppercase md:text-[10px] ${midBlur}`}
          >
            HOLDER: {holderName}
          </p>
          <p
            className={`mt-2 text-[4.5px] tracking-[0.22em] text-neutral-400 uppercase md:text-[5px] ${midBlur}`}
          >
            SERIAL REGISTER NO: {serialLine} // STATUS: {pageTwo.status}
          </p>
        </section>

        <section className="mt-5 text-center md:mt-6">
          <ul className="space-y-1">
            {pageTwo.assetReceiptItems.map((asset) => (
              <li
                key={asset}
                className={`${bodyClass} tracking-[0.08em] text-neutral-300 ${heavyBlur}`}
              >
                <span className="mr-1 text-neutral-500">•</span>
                {asset}
              </li>
            ))}
          </ul>
          <p
            className={`mt-3 text-[4.5px] tracking-[0.18em] text-neutral-500 uppercase md:text-[5px] ${midBlur}`}
          >
            LOGGED ON THE BLOCKCHAIN/LEDGER: {ledgerTimestamp}
          </p>
        </section>

        <section className="mt-5 grid flex-1 grid-cols-2 gap-2 md:mt-6 md:gap-3">
          <div className="flex flex-col items-center justify-center border border-neutral-800 bg-[#0d0d0d] px-2 py-3">
            <CertificateQrPlaceholder compact={compact} blurred={blurred} />
            <p
              className={`mt-2 text-center text-[4px] leading-relaxed tracking-[0.14em] text-neutral-500 uppercase ${heavyBlur}`}
            >
              {pageTwo.qrColumnLabel}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center border border-neutral-800 bg-[#0d0d0d] px-2 py-3">
            <CertificateEmblem
              emblemLabel={pageTwo.emblemLabel}
              curatorSignature={pageTwo.curatorSignature}
              compact={compact}
              blurred={blurred}
            />
          </div>
        </section>

        <footer className="mt-4 border-t border-neutral-800/80 pt-3 text-center md:mt-5">
          <p
            className={`text-[4px] tracking-[0.28em] text-neutral-600 italic md:text-[4.5px] ${softBlur}`}
          >
            &ldquo;{pageTwo.closingQuote}&rdquo;
          </p>
        </footer>
      </div>
    </div>
  );
}
