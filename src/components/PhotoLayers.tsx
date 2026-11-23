"use client";

import { useEffect, useRef } from "react";
import { sections } from "@/data/content";
import { store, SECTION_COUNT } from "@/lib/store";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Full-screen real photos that take over from the 3D scene for some sections. */
export default function PhotoLayers() {
  const root = useRef<HTMLDivElement>(null);
  const steamRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const layers = [...(root.current?.querySelectorAll<HTMLDivElement>(".photo-layer") ?? [])];
    const cv = steamRef.current!;
    const cx = cv.getContext("2d")!;
    const size = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    size();
    window.addEventListener("resize", size);
    const puffs = [...Array(60)].map(() => ({ l: Math.random(), o: Math.random() * 2 - 1, s: 0.6 + Math.random() * 0.8 }));

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sf = store.progress * SECTION_COUNT;
      layers.forEach((el) => {
        const i = Number(el.dataset.index);
        const w = smooth(i - 0.12, i + 0.12, sf) * (1 - smooth(i + 0.88, i + 1.12, sf));
        el.style.opacity = String(w);
        el.style.visibility = w > 0.001 ? "visible" : "hidden";
        const local = sf - i;
        const img = el.querySelector("img");
        if (img && w > 0) img.style.transform = `scale(${1.03 + local * 0.07}) translate(${store.mouse.x * -10}px, ${store.mouse.y * -8}px)`;
        if (el.dataset.steam && w > 0) {
          cx.clearRect(0, 0, cv.width, cv.height);
          const ox = cv.width * 0.5, oy = cv.height * 0.3;
          for (const q of puffs) {
            q.l += dt * 0.18 * q.s;
            if (q.l > 1) { q.l = 0; q.o = Math.random() * 2 - 1; }
            const y = oy - q.l * cv.height * 0.4, x = ox + q.o * 30 + Math.sin(q.l * 6 + q.o * 4) * 40 * q.l, r = 20 + q.l * 90;
            const g = cx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, `rgba(255,255,255,${0.08 * (1 - q.l) * Math.min(1, q.l * 6)})`);
            g.addColorStop(1, "rgba(255,255,255,0)");
            cx.fillStyle = g;
            cx.beginPath();
            cx.arc(x, y, r, 0, Math.PI * 2);
            cx.fill();
          }
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  return (
    <div ref={root} aria-hidden="true">
      {sections.map((s, i) =>
        s.photo ? (
          <div key={i} className="photo-layer" data-index={i} data-steam={s.photo.steam ? "1" : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.photo.src} alt="" style={{ objectPosition: s.photo.position ?? "50% 50%" }} crossOrigin="anonymous" />
            {s.photo.steam && <canvas ref={steamRef} />}
          </div>
        ) : null,
      )}
      {!sections.some((s) => s.photo?.steam) && <canvas ref={steamRef} style={{ display: "none" }} />}
    </div>
  );
}
