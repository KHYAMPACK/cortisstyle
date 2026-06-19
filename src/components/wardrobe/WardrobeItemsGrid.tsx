import Image from "next/image";
import type { WardrobeClothingItem } from "@/types/user";

interface WardrobeItemsGridProps {
  items: WardrobeClothingItem[];
}

export function WardrobeItemsGrid({ items }: WardrobeItemsGridProps) {
  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-[11px] tracking-[0.25em] text-neutral-400 uppercase">
        No clothing items yet
      </p>
    );
  }

  return (
    <section
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      aria-label="Owned clothing items"
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="flex flex-col border border-neutral-200 bg-white"
        >
          <div className="relative aspect-square w-full bg-neutral-50">
            {item.canvasImage && (
              <Image
                src={item.canvasImage}
                alt={item.name}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-contain p-3 mix-blend-multiply"
              />
            )}
          </div>
          <div className="border-t border-neutral-200 px-2 py-3">
            <p className="font-serif text-[9px] leading-snug tracking-[0.1em] text-neutral-900 uppercase md:text-[10px]">
              {item.name}
            </p>
            <p className="mt-1 text-[8px] tracking-[0.25em] text-neutral-400 uppercase">
              {item.category}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
