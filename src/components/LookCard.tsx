import Image from "next/image";
import { RarityBadge } from "@/components/RarityBadge";
import { computeOutfitRarityFromLook } from "@/lib/rarity";
import type { Look } from "@/types/look";

interface LookCardProps {
  look: Look;
  priority?: boolean;
  isLockedLook?: boolean;
  onSelect: (look: Look) => void;
}

const LOCKED_IMAGE_BLUR =
  "pointer-events-none select-none opacity-80 blur-[12px] backdrop-blur-md filter";

const LOCKED_METADATA_BLUR =
  "pointer-events-none select-none blur-[10px] opacity-40";

export function LookCard({
  look,
  priority = false,
  isLockedLook = false,
  onSelect,
}: LookCardProps) {
  const outfitRarity = computeOutfitRarityFromLook(look);

  return (
    <button
      type="button"
      onClick={() => onSelect(look)}
      className={`group surface-canvas-paper block w-full cursor-pointer border border-blueprint-border text-left ${
        isLockedLook ? "ring-0" : ""
      }`}
      aria-label={
        isLockedLook
          ? `Unlock premium access for ${look.title}`
          : `View ${look.title}`
      }
    >
      <div className="relative w-full overflow-hidden bg-neutral-100">
        <div
          className={`relative w-full ${isLockedLook ? LOCKED_IMAGE_BLUR : ""}`}
        >
          <Image
            src={look.image}
            alt=""
            aria-hidden={isLockedLook}
            width={look.width}
            height={look.height}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            priority={priority}
            className={`h-auto w-full object-contain ${
              isLockedLook
                ? ""
                : "transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:brightness-[0.72]"
            }`}
          />
        </div>

        <div
          className={`absolute top-3 left-3 z-10 ${
            isLockedLook ? LOCKED_METADATA_BLUR : ""
          }`}
        >
          <RarityBadge
            rarity={outfitRarity}
            className="bg-white/95 backdrop-blur-sm"
          />
        </div>

        {!isLockedLook ? (
          <>
            <div
              className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20"
              aria-hidden
            />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="font-serif text-[11px] tracking-[0.45em] text-white uppercase">
                View Look
              </span>
            </div>
          </>
        ) : (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center bg-gradient-to-t from-black/35 via-transparent to-transparent pb-4">
            <span className="font-mono text-[9px] tracking-[0.35em] text-white/90 uppercase">
              Premium Access
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-blueprint-border px-3 py-3 md:px-4 md:py-4">
        <h2 className="font-serif text-[11px] leading-snug tracking-[0.12em] text-neutral-900 uppercase md:text-xs">
          {look.title}
        </h2>

        <div
          className={`mt-2 space-y-1 ${isLockedLook ? LOCKED_METADATA_BLUR : ""}`}
          aria-hidden={isLockedLook}
        >
          <p className="text-meta text-[9px] tracking-[0.22em] uppercase">
            {look.vibe}
          </p>
          <p className="text-meta text-[9px] tracking-[0.28em] uppercase">
            By {look.modelName} // {look.guidePrice} TL
          </p>
        </div>
      </div>
    </button>
  );
}
