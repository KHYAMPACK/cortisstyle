import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem, WardrobeLook } from "@/types/user";
import { WardrobeLoadingState } from "@/components/wardrobe/WardrobeLoadingState";
import { WardrobeLookPreview } from "@/components/wardrobe/WardrobeLookPreview";
import { WardrobeSavedOutfitPreview } from "@/components/wardrobe/WardrobeSavedOutfitPreview";

interface WardrobeLooksGridProps {
  looks: WardrobeLook[];
  savedOutfits?: SavedWardrobeOutfitBlueprint[];
  inventory?: WardrobeClothingItem[];
  wardrobeLoading?: boolean;
  wardrobeError?: string | null;
  onOpenOutfitInBuilder?: (outfit: SavedWardrobeOutfitBlueprint) => void;
}

export function WardrobeLooksGrid({
  looks,
  savedOutfits = [],
  inventory = [],
  wardrobeLoading = false,
  wardrobeError = null,
  onOpenOutfitInBuilder,
}: WardrobeLooksGridProps) {
  const hasSavedOutfits = savedOutfits.length > 0;
  const hasUnlockedLooks = looks.length > 0;

  if (!wardrobeLoading && !hasSavedOutfits && !hasUnlockedLooks && !wardrobeError) {
    return (
      <p className="py-16 text-center text-[11px] tracking-[0.25em] text-neutral-400 uppercase">
        No unlocked looks yet
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {hasSavedOutfits ? (
        <section aria-label="Saved outfits">
          <p className="mb-4 font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
            Saved Outfits
          </p>
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
            {savedOutfits.map((outfit) => (
              <div key={outfit.id} className="mb-4 break-inside-avoid">
                <WardrobeSavedOutfitPreview
                  outfit={outfit}
                  inventory={inventory}
                  onOpenInBuilder={onOpenOutfitInBuilder}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Unlocked looks">
        <p className="mb-4 font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
          Unlocked Looks
        </p>

        {wardrobeLoading ? (
          <WardrobeLoadingState label="Loading unlocked looks" />
        ) : wardrobeError ? (
          <p className="py-8 text-center font-mono text-[10px] tracking-[0.12em] text-red-600 uppercase">
            {wardrobeError}
          </p>
        ) : hasUnlockedLooks ? (
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
            {looks.map((look) => (
              <div key={look.id} className="mb-4 break-inside-avoid">
                <WardrobeLookPreview look={look} />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-[11px] tracking-[0.25em] text-neutral-400 uppercase">
            No unlocked looks yet
          </p>
        )}
      </section>
    </div>
  );
}
