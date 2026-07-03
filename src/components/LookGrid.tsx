import { LookCard } from "@/components/LookCard";
import { LookCategoryPills } from "@/components/LookCategoryPills";
import { LookSectionHeader } from "@/components/LookSectionHeader";
import type { LookCategoryDefinition } from "@/lib/dynamicLooks/types";
import type { Look } from "@/types/look";

const SECTION_ID_PREFIX = "look-section-";

interface LookGridProps {
  looks?: Look[];
  categories?: LookCategoryDefinition[];
  onSelectLook: (look: Look) => void;
}

interface LookSection {
  category: LookCategoryDefinition;
  looks: Look[];
}

function groupLooksByCategory(
  looks: Look[],
  categories: LookCategoryDefinition[],
): LookSection[] {
  const byCategory = new Map<string, Look[]>();

  for (const cat of categories) {
    byCategory.set(cat.id, []);
  }

  for (const look of looks) {
    if (!look.category) continue;
    const bucket = byCategory.get(look.category);
    if (bucket) bucket.push(look);
  }

  return categories
    .map((cat) => ({ category: cat, looks: byCategory.get(cat.id) ?? [] }))
    .filter((section) => section.looks.length > 0);
}

function LookCardGrid({
  looks,
  onSelectLook,
  priorityOffset = 0,
}: {
  looks: Look[];
  onSelectLook: (look: Look) => void;
  priorityOffset?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3">
      {looks.map((look, index) => (
        <article key={look.id}>
          <LookCard
            look={look}
            priority={priorityOffset + index < 2}
            onSelect={onSelectLook}
          />
        </article>
      ))}
    </div>
  );
}

export function LookGrid({ looks, categories, onSelectLook }: LookGridProps) {
  const publicLooks = (looks ?? []).filter((look) => look.items.length > 0);
  const hasCategories = categories && categories.length > 0;

  if (!hasCategories) {
    return (
      <section aria-label="Fashion lookbook" className="pb-4">
        <LookCardGrid looks={publicLooks} onSelectLook={onSelectLook} />
      </section>
    );
  }

  const sections = groupLooksByCategory(publicLooks, categories);

  let runningCount = 0;

  return (
    <section aria-label="Fashion lookbook" className="pb-4">
      <LookCategoryPills
        categories={sections.map((s) => s.category)}
        sectionIdPrefix={SECTION_ID_PREFIX}
        collectionId="lookbook-collection"
      />

      {sections.map((section) => {
        const offset = runningCount;
        runningCount += section.looks.length;

        return (
          <div key={section.category.id}>
            <LookSectionHeader
              category={section.category}
              id={`${SECTION_ID_PREFIX}${section.category.id}`}
            />
            <LookCardGrid
              looks={section.looks}
              onSelectLook={onSelectLook}
              priorityOffset={offset}
            />
          </div>
        );
      })}
    </section>
  );
}
