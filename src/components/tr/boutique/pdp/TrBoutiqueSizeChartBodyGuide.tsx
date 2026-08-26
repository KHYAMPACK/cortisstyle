import Image from "next/image";
import type { TrSizeChartMeasurePoint } from "@/lib/tr/catalog/sizeCharts";

interface TrBoutiqueSizeChartBodyGuideProps {
  points: TrSizeChartMeasurePoint[];
}

export function TrBoutiqueSizeChartBodyGuide({
  points,
}: TrBoutiqueSizeChartBodyGuideProps) {
  return (
    <div className="mt-5 grid items-center gap-6 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-8 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <Image
        src="/tr/size-chart/woman-measure.png"
        alt=""
        width={434}
        height={614}
        className="mx-auto h-72 w-auto object-contain sm:mx-0 sm:h-80 lg:h-96"
      />
      <ul className="space-y-3.5">
        {points.map((point) => (
          <li key={point.id} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-2.5 h-px w-7 shrink-0 border-t-2 border-dashed"
              style={{ borderColor: point.swatch }}
            />
            <div>
              <p className="text-[13px] font-semibold text-neutral-950">
                {point.title}
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">
                {point.hint}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
