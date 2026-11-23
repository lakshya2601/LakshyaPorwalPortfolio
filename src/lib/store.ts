// Tiny shared state between the DOM (scroll, mouse) and the 3D scene.
export const store = {
  /** 0 → 1 across the whole page (00 base camp → 14 signal home) */
  progress: 0,
  /** current section index 0–14 */
  section: 0,
  mouse: { x: 0, y: 0 },
  started: false,
};

export const SECTION_COUNT = 15;

export function timeOfDay(p: number) {
  if (p < 0.2) return "Golden hour";
  if (p < 0.47) return "Sunset";
  if (p < 0.68) return "Night";
  return "Orbit";
}

export function isLowPower() {
  if (typeof window === "undefined") return false;
  const small = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency || 4;
  return small || cores <= 4;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
