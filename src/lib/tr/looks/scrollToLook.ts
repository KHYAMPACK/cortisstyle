/** Smooth-scroll to a kombinler look anchor. Returns false if the node is missing. */
export function scrollToCaddeLookAnchor(
  id: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const node = document.getElementById(id);
  if (!node) return false;
  node.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function caddeHashScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}
