# EcoTrail

EcoTrail is a trip planning app for lower carbon travel. It compares transport options and suggests activities, hotels, and vegetarian restaurants. Users can save choices, earn points, complete challenges, and view their trip history.

This project was built for Project A2 in the TUM course "Lab Course Projects in Recommender Systems" during Summer Semester 2026.

Team: Xuerong Xu and Yujie Liu

Supervisor: Ashmi Banerjee

Live demo: https://eco-trail-react-1.vercel.app

## Main features

- Plan a trip by entering two cities and travel dates.
- Compare transport options by carbon impact.
- View activities, hotels, and vegetarian restaurants.
- Earn points and badges for selected options.
- Join weekly, monthly, trip, and long term challenges.
- Sign in with email, password, or Google.
- View saved trips and the weekly leaderboard.

## Project structure

The frontend uses React, Vite, and Tailwind CSS. It is deployed on Vercel.

The backend uses FastAPI. It sends trip requests to OpenAI and checks image links before returning results. It is deployed on Render.

Supabase provides authentication and stores profiles, trips, activity history, badges, challenges, and leaderboard data.

## Trip data

Live trip suggestions are generated with OpenAI structured output and web search. They do not come from a booking service. The backend checks and cleans the result before it reaches the frontend.

The project also contains static demo data. This data is used when the OpenAI key is missing or a live request fails. Demo hotels and restaurants are examples. They are not booking records.

Carbon values are estimates. The reference values in `src/data.js` are based on European Environment Agency data.

## Run locally

Requirements:

- Node.js 18 or newer
- Python 3

Install the frontend:

```bash
npm install
```

Set up the backend:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp backend/.env.example backend/.env
```

Add an OpenAI key to `backend/.env` for live results:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Start the frontend and backend in separate terminals:

```bash
npm run dev
npm run dev:api
```

Frontend: http://localhost:5173

Backend: http://127.0.0.1:8000

The frontend sends local `/api` requests to the FastAPI backend through the Vite proxy.

## Supabase setup

Create a Supabase project and run these files in the SQL Editor:

1. `supabase_schema.sql`
2. `supabase_seed.sql`
3. `supabase_migration_milestone3.sql`
4. `supabase_migration_new_challenges.sql`
5. `supabase_migration_challenges_cleanup.sql`
6. `supabase_migration_six_month_pause.sql`

The SQL files create the tables, policies, seed data, and current challenges.

## Deployment

Deploy the frontend with Vercel. Set `VITE_API_BASE_URL` to the Render backend URL.

Deploy the backend with Render. Set `OPENAI_API_KEY` and `ALLOWED_ORIGINS` in the Render environment.

See `DEPLOY_GUIDE.md` for the full deployment steps.

## Technology

React, Vite, Tailwind CSS, React Router, FastAPI, OpenAI, Supabase, Vercel, and Render.
