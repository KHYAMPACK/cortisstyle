import { slugifyItemId } from '../services/photoroomApi'

/** Ensure slug is unique among existing studio node ids. */
export function uniqueItemId(base: string, existingIds: ReadonlySet<string>): string {
  let id = slugifyItemId(base)
  if (!existingIds.has(id)) return id

  let suffix = 2
  while (existingIds.has(`${id}-${suffix}`)) {
    suffix += 1
  }
  return `${id}-${suffix}`
}
