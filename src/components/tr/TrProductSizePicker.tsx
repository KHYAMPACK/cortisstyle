"use client";

interface TrProductSizePickerProps {
  sizes: string[];
  selectedSize: string | null;
  onChange: (size: string) => void;
  accentColor?: string;
}

export function TrProductSizePicker({
  sizes,
  selectedSize,
  onChange,
  accentColor = "#C2185B",
}: TrProductSizePickerProps) {
  if (sizes.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium tracking-[0.12em] text-neutral-800 uppercase">
        Beden seçin
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size;

          return (
            <button
              key={size}
              type="button"
              onClick={() => onChange(size)}
              aria-pressed={isSelected}
              className="min-w-[2.75rem] border px-3 py-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors"
              style={
                isSelected
                  ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                      color: "#ffffff",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      borderColor: "rgba(0,0,0,0.12)",
                      color: "#171717",
                    }
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
