import { ArchiveExtensionGate } from "@/components/ArchiveExtensionGate";
import { LookCard } from "@/components/LookCard";
import { getPublicHomepageLooks, isHomepageLookLocked } from "@/lib/launchGates";
import type { Look } from "@/types/look";

interface LookGridProps {
  onSelectLook: (look: Look) => void;
  onLockedLookClick: (look: Look) => void;
}

export function LookGrid({ onSelectLook, onLockedLookClick }: LookGridProps) {
  const publicLooks = getPublicHomepageLooks();

  return (
    <section aria-label="Fashion lookbook" className="px-4 pb-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {publicLooks.map((look, index) => {
          const isLockedLook = isHomepageLookLocked(index);

          return (
            <article key={look.id}>
              <LookCard
                look={look}
                priority={index < 2}
                isLockedLook={isLockedLook}
                onSelect={isLockedLook ? onLockedLookClick : onSelectLook}
              />
            </article>
          );
        })}
      </div>

      <div className="mt-4">
        <ArchiveExtensionGate />
      </div>
    </section>
  );
}
