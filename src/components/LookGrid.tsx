import { looks } from "@/data/looks";
import { ArchiveExtensionGate } from "@/components/ArchiveExtensionGate";
import { LookCard } from "@/components/LookCard";
import { HOMEPAGE_LOOK_LIMIT } from "@/lib/launchGates";
import type { Look } from "@/types/look";

interface LookGridProps {
  onSelectLook: (look: Look) => void;
}

export function LookGrid({ onSelectLook }: LookGridProps) {
  const featuredLooks = looks.slice(0, HOMEPAGE_LOOK_LIMIT);

  return (
    <section
      className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3"
      aria-label="Fashion lookbook"
    >
      {featuredLooks.map((look, index) => (
        <article key={look.id}>
          <LookCard
            look={look}
            priority={index < 2}
            onSelect={onSelectLook}
          />
        </article>
      ))}

      <ArchiveExtensionGate />
    </section>
  );
}
