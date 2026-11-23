// Tiny shared state between the DOM (scroll, mouse) and the 3D scene.
export const store = {
  /** 0 → 1 across the whole page (00 base camp → 14 signal home) */
  progress: 0,
  /** current section index 0–14 */
  section: 0,
  mouse: { x: 0, y: 0 },
  started: false,
  /** real altitude of the camera in metres, and the place name under it */
  altitude: 0,
  place: "Pangboche, Khumbu",
  /** loading of real terrain, imagery and sky */
  load: { fraction: 0, label: "Preparing the expedition", ready: false },
};

export const SECTION_COUNT = 15;

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
