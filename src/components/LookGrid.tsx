import { LookCard } from "@/components/LookCard";
import { getPublicHomepageLooks } from "@/lib/launchGates";
import type { Look } from "@/types/look";

interface LookGridProps {
  /** When provided (e.g. from server disk crawl), overrides module-resolved looks. */
  looks?: Look[];
  onSelectLook: (look: Look) => void;
}

export function LookGrid({ looks, onSelectLook }: LookGridProps) {
  const publicLooks = looks
    ? looks.filter((look) => look.items.length > 0)
    : getPublicHomepageLooks();

  return (
    <section aria-label="Fashion lookbook" className="px-4 pb-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {publicLooks.map((look, index) => (
          <article key={look.id}>
            <LookCard
              look={look}
              priority={index < 2}
              onSelect={onSelectLook}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
