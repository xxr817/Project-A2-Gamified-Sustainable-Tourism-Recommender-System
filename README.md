# EcoTrail — React Prototype

High-fidelity, click-through frontend for **Project A2: Gamification in Sustainable Tourism Recommender System** — *Lab Course Projects in Recommender Systems, TUM CM, Summer Semester 2026*.

This is the **Milestone 3** deliverable: *UI + gamification integration*. It is a real React app (the tech stack from the Milestone 1 deck) — not a mock — so you can iterate on it, deploy it to Vercel, and plug a FastAPI recommender into it during Milestone 2/3.

---

## What's inside

```
EcoTrail-React/
├── package.json              ← project manifest + dependency list
├── vite.config.js            ← Vite build config
├── tailwind.config.js        ← custom colours (forest / moss / gold)
├── postcss.config.js
├── index.html                ← single root HTML (loads /src/main.jsx)
└── src/
    ├── main.jsx              ← React entry point + Router
    ├── App.jsx               ← top-level routes + shared "points" state
    ├── index.css             ← Tailwind directives + custom utilities
    ├── data.js               ← all mock data (CO₂ figures, trips, badges…)
    ├── ui.jsx                ← shared primitives: Logo, Toast, Modal, Switch, CrowdBar, Tabs
    ├── Layout.jsx            ← AppShell — sidebar + topbar + <Outlet/>
    └── pages/
        ├── Landing.jsx       ← public landing page
        ├── Login.jsx         ← login screen
        ├── Signup.jsx        ← signup screen
        ├── Onboarding.jsx    ← preference picker after signup
        ├── Dashboard.jsx     ← home page with level progress, KPIs, recs
        ├── Plan.jsx          ← trip planner with Transport / Stay / Eat / Do tabs
        ├── Challenges.jsx    ← active challenge + 6 joinable challenges
        ├── Leaderboard.jsx   ← Munich weekly podium + table
        ├── Badges.jsx        ← 6 unlocked + 6 locked badges
        └── Profile.jsx       ← preferences, eco-weight slider, GDPR controls
```

---

## How to run (foolproof)

You need **Node.js v18 or newer**. Check by running:

```bash
node --version
```

If you don't have it, install from [nodejs.org](https://nodejs.org) (the "LTS" version).

Then in this folder:

```bash
# 1.  Install dependencies (only first time — downloads ~200 MB into node_modules/)
npm install

# 2.  Start the dev server — opens http://localhost:5173 in your browser
npm run dev

# 3.  When you want to deploy: build a static bundle into dist/
npm run build
```

`npm run dev` gives you hot-reload: edit any `.jsx` file and the browser updates instantly.

---

## How the app is wired

- **Routing** is via `react-router-dom@6`. Public routes (`/`, `/login`, `/signup`, `/onboarding`) live outside the app shell; logged-in routes are nested under `/app` and render through `AppShell`'s `<Outlet/>`.
- **Shared state** is minimal: just the user's points counter, exposed via a tiny `useUser()` context defined in `App.jsx`. Components like the Transport tab call `addPoints(25)` and the sidebar / topbar reflect the new total instantly.
- **Styling** is Tailwind CSS. The custom colour palette lives in `tailwind.config.js`. Common visual recipes (`gradient-forest`, `map-tile`, `crowd-bar`) are utility classes in `index.css`.
- **Icons** come from `lucide-react` — tree-shaken so only icons you import end up in the bundle.

## Where the data is fake (and how to wire the real thing)

Everything in `src/data.js` is hand-curated from the Milestone 1 deck and from public sources cited there (EEA 2023 for CO₂ figures, Booking.com 2023, Lenzen 2018, Koivisto & Hamari 2019). When you land Milestone 2 (data pipeline + first recommender), replace each constant with a `fetch(...)` to the FastAPI endpoint. The component code stays the same.

Hot spots to swap first:
- `RECOMMENDED_TRIPS` → `GET /api/recommendations?user_id=…`
- `TRANSPORT_OPTIONS` → `GET /api/transport?from=…&to=…&date=…` (Climatiq for CO₂)
- `STAY_OPTIONS` → `GET /api/stays?city=…` (Booking.com Open + GreenKey registry)
- `LEADERBOARD` → `GET /api/leaderboard?city=Munich&period=week`

---

## Deploy to Vercel

```bash
npm run build           # produces /dist
npx vercel --prod        # follow the prompts; pick "Other" framework if asked
```

Vercel will autodetect Vite. Free tier is fine for the demo.

---

© 2026 EcoTrail — Xuerong Xu, Yujie Liu — Supervisor: Ashmi Banerjee.
