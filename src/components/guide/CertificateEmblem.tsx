interface CertificateEmblemProps {
  emblemLabel: string;
  curatorSignature: string;
  compact?: boolean;
  blurred?: boolean;
}

export function CertificateEmblem({
  emblemLabel,
  curatorSignature,
  compact = false,
  blurred = false,
}: CertificateEmblemProps) {
  const outerSize = compact ? "h-14 w-14" : "h-20 w-20";

  return (
    <div
      className={`relative mx-auto flex ${outerSize} items-center justify-center ${
        blurred ? "opacity-50 blur-[1.5px]" : ""
      }`}
    >
      <div className="absolute inset-0 rounded-full border border-white/20" />
      <div className="absolute inset-[3px] rounded-full border border-neutral-700" />
      <div className="absolute inset-[7px] rounded-full border border-dashed border-neutral-600" />
      <div className="absolute inset-[11px] rounded-full border border-neutral-800 bg-[#111111]" />
      <div className="absolute inset-0 rotate-45 border border-white/5" />
      <div className="absolute inset-0 -rotate-45 border border-white/5" />
      <div className="relative z-10 px-2 text-center">
        <p className="text-[4px] tracking-[0.28em] text-neutral-300 uppercase">
          {emblemLabel}
        </p>
        <p className="mt-1 text-[3.5px] tracking-[0.22em] text-neutral-600 uppercase">
          {curatorSignature}
        </p>
      </div>
    </div>
  );
}
