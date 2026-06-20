import { looks } from "@/data/looks";
import { LookCard } from "@/components/LookCard";
import type { Look } from "@/types/look";

interface LookGridProps {
  onSelectLook: (look: Look) => void;
}

export function LookGrid({ onSelectLook }: LookGridProps) {
  return (
    <section
      className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3"
      aria-label="Fashion lookbook"
    >
      {looks.map((look, index) => (
        <article key={look.id}>
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
