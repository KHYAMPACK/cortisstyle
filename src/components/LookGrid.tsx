import { LookCard } from "@/components/LookCard";
import {
  getPublicHomepageLooks,
  HOMEPAGE_PUBLIC_LOOK_COUNT,
  isHomepageLookLocked,
} from "@/lib/launchGates";
import type { Look } from "@/types/look";

interface LookGridProps {
  /** When provided (e.g. from server disk crawl), overrides module-resolved looks. */
  looks?: Look[];
  onSelectLook: (look: Look) => void;
  onLockedLookClick: (look: Look) => void;
}

export function LookGrid({
  looks,
  onSelectLook,
  onLockedLookClick,
}: LookGridProps) {
  const publicLooks = looks
    ? looks.slice(0, HOMEPAGE_PUBLIC_LOOK_COUNT)
    : getPublicHomepageLooks();

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
    </section>
  );
}
