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
      v: 8848,
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
        The expedition · <span className="intro-alt">0000</span> m
      </div>
      <h1 className="intro-name" aria-label={profile.name}>
        {profile.shortName.split("").map((l, i) => (
          <span key={i} aria-hidden="true">{l}</span>
        ))}
      </h1>
      <p className="intro-fade intro-sub">{profile.title}</p>
      <button className="btn-ember intro-fade" onClick={() => begin(true)}>
        Begin the climb
      </button>
      <button className="link-quiet intro-fade" onClick={() => begin(false)}>
        Enter without sound
      </button>
    </div>
  );
}
