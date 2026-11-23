import type Lenis from "lenis";

export const scroller: { lenis: Lenis | null } = { lenis: null };

export function scrollToSection(i: number) {
  const el = document.querySelector<HTMLElement>(`[data-section="${i}"]`);
  if (!el) return;
  if (scroller.lenis) scroller.lenis.scrollTo(el, { duration: 2 });
  else el.scrollIntoView({ behavior: "smooth" });
}
