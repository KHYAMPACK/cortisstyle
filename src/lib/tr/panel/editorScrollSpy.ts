/**
 * Which section tab is current: the last one whose top edge has scrolled up to
 * `offset`. Callers measure each top from the spot a tab click parks its card, so
 * `offset` is just a few pixels of slack. At the very bottom of the page the last
 * tab wins, so a short final section can still be reached.
 */
export function activeSectionIndex(
  tops: readonly number[],
  offset: number,
  atBottom: boolean,
): number {
  if (tops.length === 0) return 0;
  if (atBottom) return tops.length - 1;
  let active = 0;
  tops.forEach((top, index) => {
    if (top <= offset) active = index;
  });
  return active;
}
