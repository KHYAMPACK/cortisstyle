import type { WardrobeLook } from "@/types/user";
import { WardrobeLookPreview } from "@/components/wardrobe/WardrobeLookPreview";

interface WardrobeLooksGridProps {
  looks: WardrobeLook[];
}

export function WardrobeLooksGrid({ looks }: WardrobeLooksGridProps) {
  if (looks.length === 0) {
    return (
      <p className="py-16 text-center text-[11px] tracking-[0.25em] text-neutral-400 uppercase">
        No unlocked looks yet
      </p>
    );
  }

  return (
    <section
      className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3"
      aria-label="Unlocked looks"
    >
      {looks.map((look) => (
        <div key={look.id} className="mb-4 break-inside-avoid">
          <WardrobeLookPreview look={look} />
        </div>
      ))}
    </section>
  );
}
