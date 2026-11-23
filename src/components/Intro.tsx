"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import gsap from "gsap";
import { profile } from "@/data/content";
import { ambience } from "@/lib/sound";
import { store } from "@/lib/store";
import { scroller } from "@/lib/lenis";

export default function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [ready, setReady] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${store.load.fraction})`;
      if (labelRef.current) labelRef.current.textContent = `${store.load.label} · ${Math.round(store.load.fraction * 100)}%`;
      if (store.load.ready || performance.now() - start > 25000) { setReady(true); return; }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("locked");
    scroller.lenis?.stop();
    animate(".intro-name span", {
      y: ["110%", "0%"],
      opacity: [0, 1],
      delay: stagger(70, { start: 300 }),
      duration: 1100,
      ease: "outExpo",
    });
    animate(".intro-fade", { opacity: [0, 1], y: [16, 0], delay: stagger(120, { start: 900 }), duration: 900, ease: "outQuad" });
    const counter = { v: 0 };
    animate(counter, {
      v: 6812,
      duration: 2200,
      delay: 400,
      ease: "inOutQuad",
      onUpdate: () => {
        const el = document.querySelector(".intro-alt");
        if (el) el.textContent = String(Math.round(counter.v)).padStart(4, "0");
      },
    });
  }, []);

  const begin = (withSound: boolean) => {
    if (withSound) ambience.start();
    store.started = true;
    gsap.to(ref.current, {
      opacity: 0,
      duration: 1.1,
      ease: "power2.inOut",
      onComplete: () => {
        setGone(true);
        document.documentElement.classList.remove("locked");
        scroller.lenis?.start();
        window.dispatchEvent(new Event("expedition:start"));
      },
    });
  };

  if (gone) return null;
  return (
    <div ref={ref} className="intro" role="dialog" aria-label="Welcome">
      <div className="mono label intro-fade">
        Ama Dablam · <span className="intro-alt">0000</span> m
      </div>
      <h1 className="intro-name" aria-label={profile.name}>
        {profile.shortName.split("").map((l, i) => (
          <span key={i} aria-hidden="true">{l}</span>
        ))}
      </h1>
      <p className="intro-fade intro-sub">{profile.title}</p>
      {ready ? (
        <>
          <button className="btn-ember" onClick={() => begin(true)}>Begin the climb</button>
          <button className="link-quiet" onClick={() => begin(false)}>Enter without sound</button>
        </>
      ) : (
        <div className="intro-load intro-fade">
          <div className="intro-track"><div ref={barRef} className="intro-bar" /></div>
          <div ref={labelRef} className="mono intro-load-label">Preparing the expedition</div>
        </div>
      )}
    </div>
  );
}
