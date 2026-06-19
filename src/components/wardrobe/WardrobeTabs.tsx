"use client";

interface WardrobeTabsProps {
  activeTab: "looks" | "items";
  onChange: (tab: "looks" | "items") => void;
}

const tabs = [
  { id: "looks" as const, label: "Unlocked Looks" },
  { id: "items" as const, label: "Clothing Items" },
];

export function WardrobeTabs({ activeTab, onChange }: WardrobeTabsProps) {
  return (
    <nav
      aria-label="Wardrobe sections"
      className="flex gap-8 border-b border-neutral-200"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`border-b pb-3 text-[10px] tracking-[0.35em] uppercase transition-colors ${
              isActive
                ? "-mb-px border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
