import { looks } from "@/data/looks";
import { LookCard } from "@/components/LookCard";
import type { Look } from "@/types/look";

interface LookGridProps {
  onSelectLook: (look: Look) => void;
}

export function LookGrid({ onSelectLook }: LookGridProps) {
  return (
    <section
      className="columns-1 gap-4 space-y-4 p-4 sm:columns-2 md:columns-3"
      aria-label="Fashion lookbook"
    >
      {looks.map((look, index) => (
        <article key={look.id} className="mb-4 break-inside-avoid">
          <LookCard
            look={look}
            priority={index < 2}
            onSelect={onSelectLook}
          />
        </article>
      ))}
    </section>
  );
}
