import {
  Footprints,
  Layers,
  Shirt,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import type { TrDemoGarmentKind } from "@/lib/tr/demoIcons";
import { parseTrDemoGarmentKind } from "@/lib/tr/demoIcons";

const KIND_ICON: Record<TrDemoGarmentKind, LucideIcon> = {
  look: Layers,
  top: Shirt,
  bottom: Shirt,
  dress: Shirt,
  outerwear: Shirt,
  shoe: Footprints,
  bag: ShoppingBag,
};

const KIND_LABEL: Record<TrDemoGarmentKind, string> = {
  look: "Kombin",
  top: "Üst",
  bottom: "Alt",
  dress: "Elbise",
  outerwear: "Dış",
  shoe: "Ayakkabı",
  bag: "Çanta",
};

interface TrDemoGarmentVisualProps {
  kind?: TrDemoGarmentKind | null;
  /** Prefer this when rendering from product/cart image sentinel. */
  src?: string | null;
  className?: string;
  iconClassName?: string;
  /** Show small meta label under icon. */
  showLabel?: boolean;
}

export function TrDemoGarmentVisual({
  kind: kindProp,
  src,
  className = "",
  iconClassName = "h-10 w-10 md:h-12 md:w-12",
  showLabel = false,
}: TrDemoGarmentVisualProps) {
  const kind = kindProp ?? parseTrDemoGarmentKind(src) ?? "look";
  const Icon = KIND_ICON[kind];

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-ice-floor text-neutral-400 ${className}`}
      aria-hidden
    >
      <Icon
        strokeWidth={1.15}
        className={`${iconClassName} ${kind === "bottom" ? "rotate-180 opacity-80" : ""}`}
      />
      {showLabel ? (
        <span className="font-mono text-[9px] tracking-[0.22em] uppercase">
          {KIND_LABEL[kind]}
        </span>
      ) : null}
    </div>
  );
}
