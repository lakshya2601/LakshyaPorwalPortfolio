"use client";

import { useEffect, useRef, useState } from "react";
import { store, SECTION_COUNT } from "@/lib/store";
import { boilingPoint } from "@/lib/expedition";
import { sections, profile } from "@/data/content";
import { ambience } from "@/lib/sound";
import { scrollToSection } from "@/lib/lenis";

export default function HUD() {
  const altRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLDivElement>(null);
  const boilRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const p = store.progress, alt = store.altitude;
      if (altRef.current) altRef.current.textContent = Math.round(alt).toLocaleString("en-IN");
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      const sec = sections[store.section];
      const placeName = sec?.photo ? sec.camp : store.place;
      if (placeRef.current && placeRef.current.textContent !== placeName) placeRef.current.textContent = placeName;
      if (boilRef.current) boilRef.current.textContent = alt > 20000 ? "No liquid water up here" : `Water boils at ${boilingPoint(alt).toFixed(1)} °C`;
      if (store.section !== last) {
        last = store.section;
        setActive(last);
      }
      setSound(ambience.enabled);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hud">
      <button className="logo" onClick={() => scrollToSection(0)} aria-label="Back to base camp">
        {profile.shortName}
        <span className="ember">.</span>
      </button>

      <div className="altimeter glass" aria-label="Altitude">
        <div className="mono label">Altitude</div>
        <div className="alt-value mono">
          <span ref={altRef}>4,380</span>
          <small> m</small>
        </div>
        <div className="mono boil" ref={boilRef}>Water boils at 85.3 °C</div>
        <div className="place" ref={placeRef}>Pangboche, Khumbu</div>
        <div className="alt-track">
          <div ref={barRef} className="alt-bar" />
        </div>
      </div>

      <nav className="dots" aria-label="Sections">
        {Array.from({ length: SECTION_COUNT }).map((_, i) => {
          const s = sections[i];
          const name = s.kind === "hero" ? "Base camp" : s.title;
          return (
            <button
              key={i}
              className={i === active ? "on" : ""}
              onClick={() => scrollToSection(i)}
              aria-label={`${String(i).padStart(2, "0")} ${name}`}
            >
              <span className="mono">{String(i).padStart(2, "0")}</span>
              <em>{name}</em>
            </button>
          );
        })}
      </nav>

      <button
        className="sound glass mono"
        onClick={() => setSound(ambience.toggle())}
        aria-pressed={sound}
        aria-label={sound ? "Turn sound off" : "Turn sound on"}
      >
        <span className={`bars ${sound ? "playing" : ""}`}>
          <i /><i /><i /><i />
        </span>
        {sound ? "Sound on" : "Sound off"}
      </button>
    </div>
  );
}
