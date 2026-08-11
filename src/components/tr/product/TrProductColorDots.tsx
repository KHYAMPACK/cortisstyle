import type { TrProductColor } from "@/types/tr-marketplace";

const CARD_SWATCH_LIMIT = 3;

interface TrProductColorDotsProps {
  colors: TrProductColor[];
  className?: string;
}

export function TrProductColorDots({ colors, className = "" }: TrProductColorDotsProps) {
  if (colors.length === 0) return null;

  const visible = colors.slice(0, CARD_SWATCH_LIMIT);
  const overflow = colors.length - visible.length;

  return (
    <div className={`flex items-center gap-1.5 ${className}`.trim()}>
      {visible.map((color) => (
        <span
          key={`${color.name}-${color.hex}`}
          title={color.name}
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
          style={{ backgroundColor: color.hex }}
        />
      ))}
      {overflow > 0 ? (
        <span className="text-[10px] tracking-[0.06em] text-neutral-500">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
