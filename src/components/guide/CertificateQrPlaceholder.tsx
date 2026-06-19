const QR_MASK = [
  0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 22, 24,
];

interface CertificateQrPlaceholderProps {
  compact?: boolean;
  blurred?: boolean;
}

export function CertificateQrPlaceholder({
  compact = false,
  blurred = false,
}: CertificateQrPlaceholderProps) {
  const size = compact ? "h-12 w-12" : "h-16 w-16";

  return (
    <div
      aria-hidden
      className={`mx-auto grid ${size} grid-cols-5 grid-rows-5 gap-px border border-neutral-600 bg-[#0a0a0a] p-1 ${
        blurred ? "opacity-35 blur-[2px]" : ""
      }`}
    >
      {Array.from({ length: 25 }).map((_, index) => (
        <span
          key={index}
          className={QR_MASK.includes(index) ? "bg-neutral-100" : "bg-transparent"}
        />
      ))}
    </div>
  );
}
