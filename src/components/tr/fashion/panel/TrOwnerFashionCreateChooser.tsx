"use client";

import { Layers, Shirt, Upload } from "lucide-react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerProductRouteGate } from "@/components/tr/panel/TrOwnerProductRouteGate";
import { TrPanelChoiceCard } from "@/components/tr/panel/TrPanelChoiceCard";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import {
  trPanelBatchNewProductsPath,
  trPanelNewFashionSingleProductPath,
  trPanelProductsPath,
  trPanelTakimNewProductPath,
} from "@/lib/tr/paths";

const ICON = { className: "h-5 w-5", strokeWidth: 1.75, "aria-hidden": true };

/** Second step for fashion boutiques: which garment flow to start. */
export function TrOwnerFashionCreateChooser() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrOwnerProductRouteGate activeBoutique={activeBoutique}>
          <TrPanelEditor
            backHref={trPanelProductsPath()}
            parentLabel="Ürünler"
            title="Moda ürünü ekle"
          >
            <div className="pt-3">
              <h2 className="text-[18px] font-semibold text-neutral-900">
                Nasıl eklemek istersiniz?
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <TrPanelChoiceCard
                  href={trPanelNewFashionSingleProductPath()}
                  icon={<Shirt {...ICON} />}
                  title="Tek parça"
                  description="Tek bir giysi için adım adım sihirbaz: fotoğraf, isim, fiyat ve beden."
                />
                <TrPanelChoiceCard
                  href={trPanelTakimNewProductPath()}
                  icon={<Layers {...ICON} />}
                  title="Takım"
                  description="Üst ve alt parçayı birlikte, tek bir takım ürünü olarak yükleyin."
                />
                <TrPanelChoiceCard
                  href={trPanelBatchNewProductsPath()}
                  icon={<Upload {...ICON} />}
                  title="Toplu ekle"
                  description="Birden fazla ürünü aynı oturumda yükleyin."
                />
              </div>
            </div>
          </TrPanelEditor>
        </TrOwnerProductRouteGate>
      )}
    </TrOwnerPanelGate>
  );
}
