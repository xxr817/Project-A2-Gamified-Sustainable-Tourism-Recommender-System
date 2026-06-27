# EcoTrail — Gamified Sustainable Tourism Recommender

**Project A2 · Lab Course Projects in Recommender Systems · TUM CM · Summer Semester 2026**
Team: Xuerong Xu, Yujie Liu · Supervisor: Ashmi Banerjee

🔗 **Live demo:** https://eco-trail-react-1.vercel.app

> A gamified recommender that nudges travellers toward lower-carbon choices — points, levels, badges and weekly challenges layered on top of AI-assisted, sustainability-first trip planning.

---

## What it does

- **AI trip planner** — enter a route and dates; the app returns sustainability-ranked **transport, stays and activities** with plausible CO₂ estimates, generated live by an LLM.
- **Gamification loop** — earn points for green choices → level up → unlock **badges**; join **weekly challenges** with progress tracking and rewards. All persisted per user.
- **Accounts** — email/password + Google sign-in (Supabase Auth), with a profile and a weekly **leaderboard**.

---

## Architecture

```
Browser
  │
  ├──► Frontend (React + Vite)        ──►  Vercel        https://eco-trail-react-1.vercel.app
  │        │
  │        ├─ data, auth, gamification ──► Supabase (Postgres + Auth + RLS)
  │        │
  │        └─ AI trip planning  /api  ──► Backend (FastAPI)  ──► Render  ──► OpenAI
```

- **Frontend** — React 18 + Vite + Tailwind, deployed on **Vercel**.
- **Backend** — **FastAPI** (a thin service that holds the OpenAI key and calls the model), deployed on **Render**. Talks to the frontend via `VITE_API_BASE_URL`; CORS-restricted to the deployed frontend.
- **Database/Auth** — **Supabase** (PostgreSQL, Row-Level Security, Supabase Auth).
- **AI** — OpenAI (`gpt-4.1-mini`) with structured JSON output. Without an API key the backend falls back to a built-in demo plan, so the app still runs.

---

## Where the data comes from (honest note)

- **Real, cited constant:** CO₂-per-passenger-km figures are from the **European Environment Agency (EEA), 2023** (e.g. train 35 g, car 170 g, short flight 255 g).
- **AI-generated at request time:** the per-route trip recommendations (transport / stays / activities) are produced by the LLM, structured by a fixed JSON schema — not retrieved from live travel APIs.
- **Hand-curated reference/seed data:** destinations, badges, challenges and demo content (Supabase seed + `src/data.js`).
- **Planned future integrations (not yet wired):** live Booking.com / OpenStreetMap / Climatiq / GreenKey feeds, and the Strava/review-based badges (currently hidden in the UI).

---

## Run locally

Requires **Node 18+** and **Python 3**.

**One-time setup** (each teammate, in their own clone):
```bash
cd <repo>
npm install                                   # frontend deps (node_modules)

python3 -m venv .venv                          # backend virtual-env — must be named .venv
.venv/bin/pip install -r requirements.txt      # backend deps (FastAPI, uvicorn, certifi)

cp backend/.env.example backend/.env           # create your own env file
# For real AI results, add your own key in backend/.env:  OPENAI_API_KEY=sk-...
# Leave it blank to run in demo mode — no key needed, the app still works.
```

**Run** — two terminals:
```bash
npm run dev        # terminal 1 · frontend · http://localhost:5173
npm run dev:api    # terminal 2 · backend  · http://127.0.0.1:8000
```

- `npm run dev:api` runs the backend from `.venv` and auto-loads `backend/.env` (via `--env-file`).
- **Without an `OPENAI_API_KEY` the backend returns a built-in demo plan, so the app still runs** (the demo data is fixed, not route-specific).
- The frontend proxies `/api` → `localhost:8000` in dev; production reads `VITE_API_BASE_URL`.
- `backend/.env`, `.venv/` and `node_modules/` are git-ignored — each teammate creates their own.

---

## Deployment

- **Frontend → Vercel** (Vite preset). Set env `VITE_API_BASE_URL` to the backend URL.
- **Backend → Render** (`render.yaml` included). Set env `OPENAI_API_KEY` and `ALLOWED_ORIGINS` (the frontend URL).
- **Database → Supabase.** Apply `supabase_schema.sql` + `supabase_seed.sql`, then `supabase_migration_milestone3.sql`.

See `DEPLOY_GUIDE.md` for step-by-step instructions.

---

## Tech stack

React 18 · Vite · Tailwind CSS · React Router · FastAPI · OpenAI · Supabase (Postgres/Auth) · Vercel · Render

---

*GenAI disclosure: this project uses OpenAI both as a product feature (the trip planner) and as a development aid. Details are documented in the final report.*
