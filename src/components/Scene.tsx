"use client";

import { useEffect, useRef } from "react";
import { store, SECTION_COUNT, isLowPower } from "@/lib/store";

/** Works out how far down the page we are (0 → 1), section by section. */
function readProgress() {
  const mid = window.innerHeight * 0.5;
  const els = document.querySelectorAll<HTMLElement>("[data-section]");
  let p = 0;
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.top <= mid) {
      const frac = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
      p = (i + frac) / SECTION_COUNT;
    }
  });
  return Math.min(1, p);
}

export default function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let disposed = false;
    let scene: import("@/lib/expedition").ExpeditionScene | null = null;

    const onMouse = (e: PointerEvent) => {
      store.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      store.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onResize = () => scene?.resize();

    import("@/lib/expedition").then(({ ExpeditionScene }) => {
      if (disposed || !canvasRef.current) return;
      scene = new ExpeditionScene(canvasRef.current, isLowPower());
      const loop = () => {
        const target = readProgress();
        store.progress += (target - store.progress) * 0.08;
        store.section = Math.min(SECTION_COUNT - 1, Math.floor(target * SECTION_COUNT));
        scene!.render(store.progress, store.mouse);
        raf = requestAnimationFrame(loop);
      };
      loop();
      canvasRef.current.classList.add("ready");
    });

    window.addEventListener("pointermove", onMouse);
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener("resize", onResize);
      scene?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene" aria-hidden="true" />;
}
