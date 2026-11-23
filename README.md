# The Expedition — Lakshya Porwal's portfolio

A scroll-driven 3D portfolio. You start in a golden-hour valley (wildflowers, lake, pine forest), climb the peak through sunset and night, and lift off into space at the summit.

**Stack:** Next.js 16 · TypeScript · Three.js · GSAP (ScrollTrigger) · Anime.js v4 · Lenis

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Edit your content

Everything you'll want to change is in **`src/data/content.ts`** — name, stats, links, all 15 sections, projects, recipe steps, gear map and layers. Search for `TODO`.

- **Resume:** put your PDF at `public/resume.pdf`.
- **Photos (Off the clock):** put images in `public/photos/` and set `image: "/photos/trek.jpg"` in `offClock`.

## Contact form

Uses [Resend](https://resend.com) (free tier). Copy `.env.example` to `.env.local` and fill in:

```
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=you@example.com
```

On Vercel, add the same values under Project → Settings → Environment Variables.

## Deploy

Import the repo at [vercel.com/new](https://vercel.com/new) — no extra config needed.

## Where things live

| File | What it does |
| --- | --- |
| `src/lib/expedition.ts` | The whole 3D world: terrain, lake, trees, grass, flowers, clouds, birds, campfires, trail, climber, stars, galaxy, planet, day→night sky |
| `src/components/Sections.tsx` | The 15 sections + GSAP scroll reveals + Anime.js letter animations |
| `src/components/Intro.tsx` | "Begin the climb" intro screen |
| `src/components/HUD.tsx` | Altitude meter, section nav, sound toggle |
| `src/lib/sound.ts` | Wind and campfire sound, generated live (no audio files) |
| `src/app/api/contact/route.ts` | Contact form → email |

## Performance

Phones and low-power devices get fewer trees, grass and particles and no bloom. Visitors with "reduce motion" switched on get no smooth scroll or reveal animations.
