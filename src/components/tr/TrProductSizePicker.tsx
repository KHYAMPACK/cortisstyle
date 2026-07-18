"use client";

interface TrProductSizePickerProps {
  sizes: string[];
  selectedSize: string | null;
  onChange: (size: string) => void;
  /** Boutique theme accent; defaults to marketplace brand primary. */
  accentColor?: string;
  /** Hide the “Beden seçin” heading (e.g. sheet already has a title). */
  hideLabel?: boolean;
  className?: string;
}

export function TrProductSizePicker({
  sizes,
  selectedSize,
  onChange,
  accentColor,
  hideLabel = false,
  className = "",
}: TrProductSizePickerProps) {
  if (sizes.length === 0) return null;

  return (
    <div className={className || (hideLabel ? "mt-3" : "mt-6")}>
      {hideLabel ? null : (
        <p className="text-[11px] font-medium tracking-[0.12em] text-neutral-800 uppercase">
          Beden seçin
        </p>
      )}
      <div className={`flex flex-wrap gap-2 ${hideLabel ? "" : "mt-3"}`}>
        {sizes.map((size) => {
          const isSelected = selectedSize === size;
          const useCustomAccent = Boolean(accentColor && isSelected);

          return (
            <button
              key={size}
              type="button"
              onClick={() => onChange(size)}
              aria-pressed={isSelected}
              className={`min-w-[2.75rem] border px-3 py-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors ${
                isSelected && !accentColor
                  ? "border-brand-primary bg-brand-primary text-white"
                  : !isSelected
                    ? "border-black/12 bg-white text-neutral-900"
                    : "text-white"
              }`}
              style={
                useCustomAccent
                  ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                      color: "#ffffff",
                    }
                  : undefined
              }
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
