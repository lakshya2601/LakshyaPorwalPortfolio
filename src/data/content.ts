// ─────────────────────────────────────────────────────────────
//  ALL PORTFOLIO CONTENT LIVES HERE.
//  Edit this file to change text, links, projects and stats.
//  Lines marked TODO still need your real details.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: "Lakshya Porwal",
  shortName: "LAKSHYA",
  title: "AI/ML engineer · Full stack developer",
  location: "Indore, India",
  email: "TODO@example.com", // TODO: your email (shown on the site)
  linkedin: "https://www.linkedin.com/in/TODO", // TODO
  github: "https://github.com/lakshya2601",
  instagram: "", // TODO (optional) — leave empty to hide
  resume: "/resume.pdf", // TODO: add public/resume.pdf
};

export const stats = [
  { value: "2+", label: "Years shipping" },
  { value: "AI · Web · Mobile", label: "End to end" },
  { value: "iOS", label: "App live in production" },
];

export type Tag = string;

/** A real photo that takes over the screen for a section (Unsplash, free licence). */
export type Photo = { src: string; credit: string; position?: string; steam?: boolean };
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=2400&q=80&auto=format&fit=crop`;

type Base = { photo?: Photo };
export type Section = Base & (
  | { kind: "hero"; camp: string }
  | { kind: "text"; camp: string; title: string; body: string; points?: string[]; tags?: Tag[] }
  | { kind: "schema"; camp: string; title: string; body: string; tables: string[]; tags?: Tag[] }
  | { kind: "experience"; camp: string; title: string; items: { role: string; org: string; note: string }[] }
  | { kind: "recipe"; camp: string; title: string; body: string }
  | { kind: "projects"; camp: string; title: string; body: string }
  | { kind: "gear"; camp: string; title: string; body: string }
  | { kind: "layers"; camp: string; title: string; body: string }
  | { kind: "offclock"; camp: string; title: string; body: string }
  | { kind: "contact"; camp: string; title: string; body: string }
);

// 15 sections — 00 to 14. Each one is a real waypoint on the climb of Ama Dablam
// (see ROUTE in src/lib/expedition.ts). Sections with a `photo` switch to a real photograph.
export const sections: Section[] = [
  { kind: "hero", camp: "Pangboche · 3,985 m" },
  {
    kind: "text",
    camp: "Trailhead",
    photo: { src: unsplash("photo-1755621089875-946937e8b609"), credit: "Prayer flags · Unsplash" },
    title: "I own the whole climb.",
    body: "From the first sketch to the production release — models, APIs and the interface people actually touch. I like problems where AI meets real users.",
    tags: ["Idea → launch", "Product minded"],
  },
  {
    kind: "text",
    camp: "Gorak Shep · Khumbu",
    photo: { src: unsplash("photo-1697746149225-63a33bcb2ea4"), credit: "Gorak Shep · Unsplash" },
    title: "Frontend and mobile",
    body: "Fast, polished web and native apps.",
    points: ["Web, iOS and Android from one team", "Reusable component libraries", "Real-time UIs and smooth interactions"],
    tags: ["React", "Next.js", "TypeScript", "React Native"],
  },
  {
    kind: "text",
    camp: "Imja Khola valley",
    title: "Backend",
    body: "Clean, fast APIs with secure sign-in.",
    points: ["Async Python services", "Auth, roles and permissions", "Background jobs and webhooks"],
    tags: ["Python", "FastAPI", "Node.js", "Express"],
  },
  {
    kind: "schema",
    camp: "Trail to base camp",
    title: "Database design",
    body: "Schemas that hold up under real traffic.",
    tables: ["USERS", "BOOKINGS", "PAYMENTS"],
    tags: ["PostgreSQL", "MongoDB", "Vector DBs"],
  },
  {
    kind: "text",
    camp: "Ama Dablam Base Camp",
    title: "Cloud and MLOps",
    body: "Containers, pipelines and models that ship on schedule.",
    points: ["Dockerised services", "CI/CD release pipelines", "Model deployment and monitoring"],
    tags: ["Docker", "CI/CD", "MLOps"],
  },
  {
    kind: "text",
    camp: "Camp 1 · SW ridge",
    title: "Integrations",
    body: "Third-party services wired in cleanly.", // TODO: name the integrations you've done
    points: ["Payments", "Maps and live tracking", "Notifications and webhooks"],
    tags: ["REST", "Webhooks", "Realtime"],
  },
  {
    kind: "text",
    camp: "Camp 1 · night",
    photo: { src: unsplash("photo-1637419980533-1119de04312f"), credit: "Tent below Ama Dablam · Unsplash", position: "50% 60%" },
    title: "LLMs and RAG",
    body: "Retrieval pipelines and AI features that answer from real data — and AI tools in my daily workflow.",
    points: ["RAG pipelines over company data", "Vector search and embeddings", "Claude, ChatGPT and Copilot every day"],
    tags: ["LangChain", "LlamaIndex", "RAG", "Vector DBs"],
  },
  {
    kind: "experience",
    camp: "Camp 2 · Yellow Tower",
    title: "Experience",
    items: [
      { role: "AI/ML Engineer", org: "Leezova Technologies", note: "AI features, RAG pipelines, MLOps — plus curriculum and product work." },
      { role: "Developer", org: "Ctruh", note: "Reusable component library; live reservation system for a restaurant chain." },
      { role: "Developer", org: "Cansvolution", note: "React Native AI support app, food delivery UI, production iOS app." },
      { role: "Freelance", org: "Full stack", note: "Web apps for small businesses." },
      { role: "B.Tech, Computer Science", org: "SVVV, Indore", note: "Graduated 2023." },
    ],
  },
  {
    kind: "recipe",
    camp: "Camp 3 · kitchen",
    photo: { src: unsplash("photo-1775626094623-99a26d94dc64"), credit: "Camp stove · Unsplash", position: "50% 38%", steam: true },
    title: "How I cook",
    body: "Up here water boils below 80 °C, so everything takes longer — like real projects. Same recipe every time. Tap a step.",
  },
  {
    kind: "projects",
    camp: "Summit · 6,812 m",
    title: "Selected projects",
    body: "Client work — names kept private.",
  },
  {
    kind: "gear",
    camp: "Above Ama Dablam",
    title: "Under the hood",
    body: "Every piece of climbing gear maps to a part of an app. Hover the gear.",
  },
  {
    kind: "layers",
    camp: "Stratosphere",
    title: "Inside the app",
    body: "Six layers, one system. Point at a layer.",
  },
  {
    kind: "offclock",
    camp: "Edge of space",
    title: "Off the clock",
    body: "Treks, night skies and slow-cooked dinners by the fire.",
  },
  {
    kind: "contact",
    camp: "Signal home",
    title: "Let's build something.",
    body: "Send a signal — I usually reply within a day.",
  },
];

export const recipe = [
  { step: "Ask early", detail: "Questions are cheaper than rewrites. I clarify before I code." },
  { step: "Plan first", detail: "A short plan, a quick prototype, then build." },
  { step: "Own it", detail: "From commit to production — and the bugs after." },
  { step: "Lift the team", detail: "Share what I learn, review kindly, teach often." },
];

export const projects = [
  {
    name: "Hotel management platform",
    blurb: "Property, rooms, bookings and billing for hotels — with a mobile app for staff.",
    role: "Backend redesign and app launch",
    stack: ["Python", "FastAPI", "PostgreSQL", "React Native"],
  },
  {
    name: "Taxi dispatch system",
    blurb: "Dispatch, driver and fleet management with a web console and driver app.",
    role: "Architecture and full stack build",
    stack: ["Node.js", "React", "React Native", "Maps"],
  },
  {
    name: "Face-recognition HR system",
    blurb: "Attendance by face recognition, plus HR records and reports.",
    role: "Backend and ML pipeline",
    stack: ["Python", "Computer vision", "REST APIs"],
  },
];

export const gear = [
  { item: "Boots", part: "Frontend", detail: "What touches the ground — the interface users walk on." },
  { item: "Rope", part: "API", detail: "Connects every climber. Strong, tested, never frays." },
  { item: "Backpack", part: "Database", detail: "Carries everything you need, organised to find fast." },
  { item: "Map and compass", part: "AI / RAG", detail: "Finds the right answer in unknown terrain." },
  { item: "Tent", part: "Cloud", detail: "Shelter that goes up anywhere, in any weather." },
  { item: "Headlamp", part: "Monitoring", detail: "See problems in the dark before they bite." },
];

export const layers = [
  { name: "Interface", detail: "React, Next.js and React Native screens." },
  { name: "API", detail: "FastAPI and Node endpoints with auth." },
  { name: "Services", detail: "Business logic, jobs and queues." },
  { name: "AI", detail: "LLMs, RAG and vector search." },
  { name: "Data", detail: "PostgreSQL, MongoDB and vector stores." },
  { name: "Cloud", detail: "Docker, CI/CD and hosting." },
];

export const offClock = [
  { title: "On the trail", caption: "Mountain treks and night skies.", image: "" }, // TODO: /photos/trek.jpg
  { title: "At the campfire", caption: "Cooking for friends, slowly.", image: "" }, // TODO: /photos/cooking.jpg
];

export const credits =
  "Terrain: AWS Terrain Tiles · Imagery: Esri, Maxar, Earthstar Geographics · Sky: Poly Haven (CC0) · Photos: Unsplash";
