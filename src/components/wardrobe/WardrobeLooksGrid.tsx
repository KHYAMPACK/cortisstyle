import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";
import type { WardrobeClothingItem, WardrobeLook } from "@/types/user";
import { WardrobeLookPreview } from "@/components/wardrobe/WardrobeLookPreview";
import { WardrobeSavedOutfitPreview } from "@/components/wardrobe/WardrobeSavedOutfitPreview";

interface WardrobeLooksGridProps {
  looks: WardrobeLook[];
  savedOutfits?: SavedWardrobeOutfitBlueprint[];
  inventory?: WardrobeClothingItem[];
}

export function WardrobeLooksGrid({
  looks,
  savedOutfits = [],
  inventory = [],
}: WardrobeLooksGridProps) {
  if (looks.length === 0 && savedOutfits.length === 0) {
    return (
      <p className="py-16 text-center text-[11px] tracking-[0.25em] text-neutral-400 uppercase">
        No unlocked looks yet
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {savedOutfits.length > 0 ? (
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
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {looks.length > 0 ? (
        <section aria-label="Unlocked looks">
          {savedOutfits.length > 0 ? (
            <p className="mb-4 font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
              Unlocked Looks
            </p>
          ) : null}
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
            {looks.map((look) => (
              <div key={look.id} className="mb-4 break-inside-avoid">
                <WardrobeLookPreview look={look} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
