"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate, stagger } from "animejs";
import {
  sections, profile, stats, recipe, projects, gear, layers, offClock, credits, type Section,
} from "@/data/content";
import { prefersReducedMotion } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

const pad = (i: number) => String(i).padStart(2, "0");

/** Splits a heading into letter spans so anime.js can animate them. */
function Letters({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {text.split(" ").map((word, wi, arr) => (
        <span key={wi}>
          <span className="word" aria-hidden="true">
            {word.split("").map((l, li) => (
              <span className="ch" key={li}>{l}</span>
            ))}
          </span>
          {wi < arr.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function Tags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="tags reveal">
      {tags.map((t) => (
        <span className="tag mono" key={t}>{t}</span>
      ))}
    </div>
  );
}

function Head({ i, camp, title }: { i: number; camp: string; title: string }) {
  return (
    <>
      <div className="mono label reveal">
        {pad(i)} · {camp}
      </div>
      <h2 className="title split">
        <Letters text={title} />
      </h2>
    </>
  );
}

/* ───────────── section bodies ───────────── */

function Hero() {
  return (
    <div className="panel hero-panel">
      <div className="mono label reveal">00 · Pangboche · 3,985 m</div>
      <h1 className="hero-name split">
        <Letters text={profile.name} />
      </h1>
      <p className="hero-title reveal">{profile.title}</p>
      <div className="stats reveal">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="scroll-cue mono reveal">
        <span className="cue-line" /> Scroll to climb
      </div>
    </div>
  );
}

function TextBody({ s, i }: { s: Extract<Section, { kind: "text" }>; i: number }) {
  return (
    <div className="panel glass">
      <Head i={i} camp={s.camp} title={s.title} />
      <p className="body reveal">{s.body}</p>
      {s.points && (
        <ul className="points">
          {s.points.map((p) => (
            <li className="reveal" key={p}>{p}</li>
          ))}
        </ul>
      )}
      <Tags tags={s.tags} />
    </div>
  );
}

function Schema({ s, i }: { s: Extract<Section, { kind: "schema" }>; i: number }) {
  return (
    <div className="panel glass">
      <Head i={i} camp={s.camp} title={s.title} />
      <p className="body reveal">{s.body}</p>
      <div className="schema reveal">
        {s.tables.map((t, ti) => (
          <div className="schema-row" key={t}>
            <div className="table mono">
              <b>{t}</b>
              <span>id · {ti === 0 ? "name · email" : ti === 1 ? "user_id · room · dates" : "booking_id · amount"}</span>
            </div>
            {ti < s.tables.length - 1 && <div className="rel mono">1 ─── n</div>}
          </div>
        ))}
      </div>
      <Tags tags={s.tags} />
    </div>
  );
}

function Experience({ s, i }: { s: Extract<Section, { kind: "experience" }>; i: number }) {
  return (
    <div className="panel glass wide">
      <Head i={i} camp={s.camp} title={s.title} />
      <ol className="timeline">
        {s.items.map((it) => (
          <li className="reveal" key={it.org + it.role}>
            <span className="pin" />
            <div>
              <b>{it.role}</b> <span className="muted">· {it.org}</span>
              <p>{it.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Recipe({ s, i }: { s: Extract<Section, { kind: "recipe" }>; i: number }) {
  const [done, setDone] = useState<boolean[]>(recipe.map(() => false));
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    const steam = animate(root.current.querySelectorAll(".wisp"), {
      y: [0, -40],
      opacity: [0, 0.7, 0],
      scaleX: [1, 1.6],
      delay: stagger(450),
      duration: 2600,
      loop: true,
      ease: "outSine",
    });
    // tick the steps one by one when the card scrolls into view
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top 65%",
      once: true,
      onEnter: () => recipe.forEach((_, k) => setTimeout(() => setDone((d) => d.map((v, j) => (j === k ? true : v))), 500 + k * 450)),
    });
    return () => { steam.revert(); st.kill(); };
  }, []);

  useEffect(() => {
    if (!document.querySelector(".recipe .step.done .check path")) return;
    animate(".recipe .step.done .check path", { strokeDashoffset: [24, 0], duration: 500, ease: "outQuad" });
  }, [done]);

  return (
    <div className="panel glass recipe" ref={root}>
      <div className="steam" aria-hidden="true">
        <span className="wisp" /><span className="wisp" /><span className="wisp" />
      </div>
      <Head i={i} camp={s.camp} title={s.title} />
      <p className="body reveal">{s.body}</p>
      <div className="recipe-card reveal">
        <div className="mono recipe-meta">
          <span>Serves: every project</span>
          <span>Prep: day one</span>
        </div>
        <ol>
          {recipe.map((r, k) => (
            <li key={r.step}>
              <button
                className={`step ${done[k] ? "done" : ""}`}
                onClick={() => setDone((d) => d.map((v, j) => (j === k ? !v : v)))}
                aria-pressed={done[k]}
              >
                <svg className="check" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10.5" />
                  <path d="M7 12.5l3.2 3.2L17 9" strokeDasharray="24" strokeDashoffset={done[k] ? 0 : 24} />
                </svg>
                <span>
                  <b>{pad(k + 1)} · {r.step}</b>
                  <small>{r.detail}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Projects({ s, i }: { s: Extract<Section, { kind: "projects" }>; i: number }) {
  return (
    <div className="projects-wrap">
      <div className="panel glass projects-intro">
        <Head i={i} camp={s.camp} title={s.title} />
        <p className="body reveal">{s.body}</p>
      </div>
      <div className="projects-track">
        {projects.map((p, k) => (
          <article className="project glass" key={p.name}>
            <div className="mono label">Route {pad(k + 1)}</div>
            <h3>{p.name}</h3>
            <p>{p.blurb}</p>
            <p className="muted"><b>My role:</b> {p.role}</p>
            <div className="tags">
              {p.stack.map((t) => <span className="tag mono" key={t}>{t}</span>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Gear({ s, i }: { s: Extract<Section, { kind: "gear" }>; i: number }) {
  const [on, setOn] = useState(0);
  return (
    <div className="panel glass wide">
      <Head i={i} camp={s.camp} title={s.title} />
      <p className="body reveal">{s.body}</p>
      <div className="gear reveal">
        <div className="gear-list">
          {gear.map((g, k) => (
            <button
              key={g.item}
              className={k === on ? "on" : ""}
              onMouseEnter={() => setOn(k)}
              onFocus={() => setOn(k)}
              onClick={() => setOn(k)}
            >
              <span className="mono">{pad(k + 1)}</span> {g.item}
              <em className="mono">→ {g.part}</em>
            </button>
          ))}
        </div>
        <div className="gear-detail" key={on}>
          <div className="mono label">{gear[on].item}</div>
          <div className="gear-part">{gear[on].part}</div>
          <p>{gear[on].detail}</p>
        </div>
      </div>
    </div>
  );
}

function Layers({ s, i }: { s: Extract<Section, { kind: "layers" }>; i: number }) {
  const [on, setOn] = useState(0);
  return (
    <div className="panel glass wide">
      <Head i={i} camp={s.camp} title={s.title} />
      <p className="body reveal">{s.body}</p>
      <div className="layers reveal">
        <div className="stack">
          {layers.map((l, k) => (
            <button
              key={l.name}
              className={`layer ${k === on ? "on" : ""}`}
              style={{ ["--k" as string]: k }}
              onMouseEnter={() => setOn(k)}
              onFocus={() => setOn(k)}
              onClick={() => setOn(k)}
            >
              <span className="mono">{pad(k + 1)}</span> {l.name}
            </button>
          ))}
        </div>
        <div className="layer-detail">
          <div className="mono label">Layer {pad(on + 1)}</div>
          <div className="gear-part">{layers[on].name}</div>
          <p>{layers[on].detail}</p>
        </div>
      </div>
    </div>
  );
}

function OffClock({ s, i }: { s: Extract<Section, { kind: "offclock" }>; i: number }) {
  return (
    <div className="panel glass wide">
      <Head i={i} camp={s.camp} title={s.title} />
      <p className="body reveal">{s.body}</p>
      <div className="photos">
        {offClock.map((o, k) => (
          <figure className="photo reveal" key={o.title}>
            {o.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.image} alt={o.caption} />
            ) : (
              <div className={`photo-ph ph-${k}`} aria-hidden="true" />
            )}
            <figcaption>
              <b>{o.title}</b>
              <span>{o.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {profile.instagram && (
        <a className="link mono reveal" href={profile.instagram} target="_blank" rel="noreferrer">
          Follow the trail on Instagram ↗
        </a>
      )}
    </div>
  );
}

function Contact({ s, i }: { s: Extract<Section, { kind: "contact" }>; i: number }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!String(data.email || "").match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setStatus("error");
      setError("Enter a valid email.");
      return;
    }
    if (String(data.message || "").trim().length < 5) {
      setStatus("error");
      setError("Write a short message first.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't send. Try again.");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't send. Try again.");
    }
  }

  return (
    <div className="panel glass wide contact">
      <Head i={i} camp={s.camp} title={s.title} />
      <p className="body reveal">{s.body}</p>
      <form className="form reveal" onSubmit={submit} noValidate>
        <label>
          <span className="mono">Your email</span>
          <input name="email" type="email" placeholder="name@company.com" required onChange={() => setError("")} />
        </label>
        <label>
          <span className="mono">Company</span>
          <input name="company" type="text" placeholder="Acme Labs" />
        </label>
        <label className="full">
          <span className="mono">Why connect?</span>
          <select name="reason" defaultValue="Hiring">
            <option>Hiring</option>
            <option>Freelance project</option>
            <option>Collaboration</option>
            <option>Just saying hi</option>
          </select>
        </label>
        <label className="full">
          <span className="mono">Message</span>
          <textarea name="message" rows={4} placeholder="Tell me about the climb you have in mind." onChange={() => setError("")} />
        </label>
        <div className="full form-foot">
          <button className="btn-ember" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : status === "sent" ? "Signal received" : "Send signal"}
          </button>
          {error && <span className="form-error">{error}</span>}
          {status === "sent" && <span className="form-ok">Thanks — I&apos;ll get back to you soon.</span>}
        </div>
      </form>
      <div className="links reveal">
        <a className="link mono" href={`mailto:${profile.email}`}>Email</a>
        <a className="link mono" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
        <a className="link mono" href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        <a className="link mono" href={profile.resume} target="_blank" rel="noreferrer">Resume ↗</a>
      </div>
      <footer className="mono footer">
        © {new Date().getFullYear()} {profile.name} · {profile.location}
        <br />
        <span className="credits">{credits}</span>
      </footer>
    </div>
  );
}

function Body({ s, i }: { s: Section; i: number }) {
  switch (s.kind) {
    case "hero": return <Hero />;
    case "text": return <TextBody s={s} i={i} />;
    case "schema": return <Schema s={s} i={i} />;
    case "experience": return <Experience s={s} i={i} />;
    case "recipe": return <Recipe s={s} i={i} />;
    case "projects": return <Projects s={s} i={i} />;
    case "gear": return <Gear s={s} i={i} />;
    case "layers": return <Layers s={s} i={i} />;
    case "offclock": return <OffClock s={s} i={i} />;
    case "contact": return <Contact s={s} i={i} />;
  }
}

/* ───────────── all sections + scroll animation ───────────── */

export default function Sections() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      // fade/slide everything marked .reveal
      gsap.utils.toArray<HTMLElement>(".sec").forEach((sec) => {
        const items = sec.querySelectorAll(".reveal");
        if (!reduced && items.length) {
          gsap.from(items, {
            y: 40,
            opacity: 0,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 70%", toggleActions: "play none none reverse" },
          });
        }
        // anime.js letter animation on headings
        const letters = sec.querySelectorAll(".split .ch");
        if (!reduced && letters.length && !sec.classList.contains("sec-hero")) {
          ScrollTrigger.create({
            trigger: sec,
            start: "top 70%",
            onEnter: () => animate(letters, { y: ["100%", "0%"], opacity: [0, 1], rotate: [8, 0], delay: stagger(22), duration: 900, ease: "outExpo" }),
            onEnterBack: () => animate(letters, { opacity: [0.2, 1], delay: stagger(12), duration: 500, ease: "outQuad" }),
          });
        }
      });

      // horizontal project scroll (desktop)
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const wrap = document.querySelector<HTMLElement>(".projects-wrap");
        const track = document.querySelector<HTMLElement>(".projects-track");
        if (!wrap || !track) return;
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
        if (dist() < 40) return;
        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: wrap.closest(".sec"),
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });
    }, root);

    const refresh = () => {
      ScrollTrigger.refresh();
      if (!reduced) {
        animate(".sec-hero .ch", { y: ["100%", "0%"], opacity: [0, 1], delay: stagger(40, { start: 200 }), duration: 1200, ease: "outExpo" });
      }
    };
    window.addEventListener("expedition:start", refresh);
    return () => {
      ctx.revert();
      window.removeEventListener("expedition:start", refresh);
    };
  }, []);

  return (
    <div ref={root}>
      {sections.map((s, i) => (
        <section
          key={i}
          id={`s${pad(i)}`}
          data-section={i}
          className={`sec sec-${s.kind} ${i % 2 ? "right" : "left"}`}
        >
          <Body s={s} i={i} />
        </section>
      ))}
    </div>
  );
}
