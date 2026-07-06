import Image from "next/image";
import type { TrProduct } from "@/types/tr-marketplace";

interface TrProductGalleryProps {
  product: Pick<TrProduct, "title" | "images">;
}

export function TrProductGallery({ product }: TrProductGalleryProps) {
  if (product.images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center border border-blueprint-border bg-blueprint-surface px-8 text-center">
        <p className="font-serif text-2xl tracking-[-0.02em] text-neutral-700">
          {product.title}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {product.images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className="relative aspect-[3/4] overflow-hidden border border-blueprint-border bg-neutral-100"
        >
          <Image
            src={image}
            alt={index === 0 ? product.title : `${product.title} — görsel ${index + 1}`}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
