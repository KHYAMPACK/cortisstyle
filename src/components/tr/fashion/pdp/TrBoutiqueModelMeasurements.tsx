import type { TrResolvedModelScale } from "@/lib/tr/fashion/modelMeasurements";

interface TrBoutiqueModelMeasurementsProps {
  scale: TrResolvedModelScale;
}

export function TrBoutiqueModelMeasurements({
  scale,
}: TrBoutiqueModelMeasurementsProps) {
  return (
    <table className="mt-6 w-full border-collapse text-[13px] leading-relaxed text-neutral-800">
      <caption className="sr-only">Model ölçüleri ve üzerindeki beden</caption>
      <tbody>
        <tr>
          <th
            scope="row"
            className="w-[36%] min-w-[7.5rem] border border-neutral-200 bg-neutral-100 px-3 py-3.5 text-left font-semibold text-neutral-950 sm:px-4"
          >
            Modelin Ölçüleri
          </th>
          <td className="border border-neutral-200 bg-white px-3 py-3.5 sm:px-4">
            {scale.measurementsLabel}
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="w-[36%] min-w-[7.5rem] border border-neutral-200 bg-neutral-100 px-3 py-3.5 text-left font-semibold text-neutral-950 sm:px-4"
          >
            Modelin Üzerindeki Beden
          </th>
          <td className="border border-neutral-200 bg-white px-3 py-3.5 sm:px-4">
            {scale.wearingSizeLabel}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
