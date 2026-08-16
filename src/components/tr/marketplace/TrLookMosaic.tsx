"use client";

import Image from "next/image";
import { TrDemoGarmentVisual } from "@/components/tr/demo/TrDemoGarmentVisual";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { isTrDemoIconSrc } from "@/lib/tr/demoIcons";
import { trKombinlerLookHref } from "@/lib/tr/looks";
import { CADDE_DISPLAY, CADDE_LABEL } from "@/lib/tr/marketplace/caddeUi";
import type { TrLookWithProducts } from "@/types/tr-look";

interface TrLookMosaicProps {
  looks: TrLookWithProducts[];
}

function LookPlate({
  look,
  index,
  className,
  sizes,
  featured = false,
}: {
  look: TrLookWithProducts;
  index: number;
  className: string;
  sizes: string;
  featured?: boolean;
}) {
  const demoCover = isTrDemoIconSrc(look.coverImage);

  return (
    <TrSoftNavLink
      href={trKombinlerLookHref(look.slug)}
      className={`group relative block aspect-[3/4] overflow-hidden bg-ice-floor outline-none focus-visible:ring-2 focus-visible:ring-jet-black focus-visible:ring-offset-2 ${className}`}
      aria-label={`${look.title} kombinine git`}
    >
      {demoCover ? (
        <TrDemoGarmentVisual
          src={look.coverImage}
          showLabel
          iconClassName="h-16 w-16"
        />
      ) : look.coverImage ? (
        <Image
          src={look.coverImage}
          alt=""
          fill
          sizes={sizes}
          unoptimized
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6">
          <span className={`${CADDE_DISPLAY} text-3xl`}>{look.title}</span>
        </div>
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent transition-colors duration-500 group-hover:from-black/60"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-4 xl:p-6">
        <p className={`${CADDE_LABEL} text-white/80`}>
          {String(index + 1).padStart(2, "0")}
        </p>
        <p
          className={`${CADDE_DISPLAY} mt-1 text-white ${
            featured
              ? "text-[clamp(1.35rem,1.8vw,2.1rem)]"
              : "text-[clamp(1rem,1.3vw,1.45rem)]"
          }`}
        >
          {look.title}
        </p>
      </div>
    </TrSoftNavLink>
  );
}

const TALL = "w-[min(22vw,20rem)]";
const MID = "w-[min(13.5vw,12.5rem)]";

export function TrLookTrio({
  entries,
}: {
  entries: { look: TrLookWithProducts; index: number }[];
}) {
  if (entries.length < 3) return null;

  return (
    <div
      className="hidden border-b border-black/10 px-8 py-14 lg:block xl:px-16 xl:py-16"
      aria-label="Kombinler"
    >
      <div className="flex items-end justify-center gap-6 xl:gap-8">
        {entries.slice(0, 3).map((entry, slot) => (
          <LookPlate
            key={entry.look.id}
            look={entry.look}
            index={entry.index}
            featured={slot === 1}
            className={
              slot === 1 ? "w-[min(24vw,21rem)]" : "w-[min(20vw,17rem)]"
            }
            sizes={slot === 1 ? "21rem" : "17rem"}
          />
        ))}
      </div>
    </div>
  );
}

export function TrLookQuad({
  entries,
}: {
  entries: { look: TrLookWithProducts; index: number }[];
}) {
  if (entries.length < 4) return null;

  return (
    <div
      className="hidden border-b border-black/10 px-8 py-14 lg:block xl:px-16 xl:py-16"
      aria-label="Kombinler"
    >
      <div className="flex items-end justify-center gap-5 xl:gap-6">
        {entries.slice(0, 4).map((entry) => (
          <LookPlate
            key={entry.look.id}
            look={entry.look}
            index={entry.index}
            className="w-[min(16vw,14rem)]"
            sizes="14rem"
          />
        ))}
      </div>
    </div>
  );
}

export function TrLookMosaic({ looks }: TrLookMosaicProps) {
  if (looks.length === 0) return null;

  const tallLeft = looks[0]!;
  const tallRight = looks.length >= 4 ? looks[looks.length - 1]! : null;
  const middle = tallRight
    ? looks.slice(1, looks.length - 1)
    : looks.slice(1);

  return (
    <>
      <div
        className="grid grid-cols-2 gap-3 px-5 py-8 lg:hidden"
        aria-label="Kombinleri seç"
      >
        {looks.map((look, index) => (
          <LookPlate
            key={look.id}
            look={look}
            index={index}
            className="w-full"
            sizes="46vw"
          />
        ))}
      </div>

      <div
        className="hidden border-b border-black/10 px-8 py-12 lg:block xl:px-14 xl:py-16"
        aria-label="Kombinleri seç"
      >
        {looks.length === 1 ? (
          <div className="flex justify-center">
            <LookPlate
              look={tallLeft}
              index={0}
              featured
              className="w-[min(32vw,26rem)]"
              sizes="26rem"
            />
          </div>
        ) : looks.length === 2 ? (
          <div className="flex items-start justify-center gap-6 xl:gap-8">
            {looks.map((look, index) => (
              <LookPlate
                key={look.id}
                look={look}
                index={index}
                featured
                className={TALL}
                sizes="20rem"
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-5 xl:gap-7">
            <LookPlate
              look={tallLeft}
              index={0}
              featured
              className={TALL}
              sizes="20rem"
            />

            {middle.length === 2 ? (
              <div className="flex flex-col gap-5 xl:gap-7">
                {middle.map((look, index) => (
                  <LookPlate
                    key={look.id}
                    look={look}
                    index={index + 1}
                    className={MID}
                    sizes="13rem"
                  />
                ))}
              </div>
            ) : middle.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 xl:gap-7">
                {middle.map((look, index) => (
                  <LookPlate
                    key={look.id}
                    look={look}
                    index={index + 1}
                    className={MID}
                    sizes="13rem"
                  />
                ))}
              </div>
            ) : null}

            {tallRight ? (
              <LookPlate
                look={tallRight}
                index={looks.length - 1}
                featured
                className={TALL}
                sizes="20rem"
              />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
