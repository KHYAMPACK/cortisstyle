/** Zara-style open-lid shopping bag — rectangle body with raised open lid. */
export function TrZaraBagIcon({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  const label = count > 99 ? "99" : String(count);

  return (
    <span
      className={`relative inline-flex h-[15px] w-[13px] shrink-0 flex-col items-stretch ${className}`}
      aria-hidden
    >
      {/* Open lid */}
      <span className="mx-[1.5px] h-[3.5px] border border-b-0 border-jet-black" />
      {/* Body */}
      <span className="relative flex flex-1 items-center justify-center border border-jet-black">
        <span className="text-[7px] leading-none font-medium tracking-tight text-jet-black">
          {label}
        </span>
      </span>
    </span>
  );
}
