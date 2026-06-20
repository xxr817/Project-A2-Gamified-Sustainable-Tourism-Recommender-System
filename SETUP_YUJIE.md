# EcoTrail – Setup für Yujie

Hi Yujie,

Status update: Ich hab das Backend von FastAPI auf **Supabase** umgestellt (PostgreSQL + Auth + auto REST API). Der alte `backend/`-Ordner ist noch im Repo, wird aber nicht mehr verwendet.

## Lokal laufen lassen

```bash
cd ~/Desktop/EcoTrail-React
npm install
npm run dev
```

Browser: http://localhost:5173

## Erstes Login

1. "Continue with Google"
2. Du siehst eine **"unverified app"**-Warnung von Google → klick **Advanced** → **Go to EcoTrail (unsafe)**
3. Nach erfolgreichem Login wird automatisch ein Profil für dich in der `profiles`-Tabelle erstellt (Level 1, 0 pts)
4. Du landest auf dem Dashboard

## Wo das Backend liegt

- Supabase URL: `https://oisejxasfycdkafckpfe.supabase.co`
- Publishable Key ist in `src/supabase.js` hardcoded (safe — RLS schützt die Daten)
- **Wenn du Zugriff aufs Supabase Dashboard willst** (für SQL Editor / Table Editor / RLS-Policies): schick mir deine Google-E-Mail, ich lade dich als Collaborator ein

## Was ich umgestellt habe

- `src/AuthContext.jsx` — Supabase Auth statt Firebase
- `src/supabase.js` — Client init (mit Web-Locks-Fix, siehe Kommentar)
- `src/Layout.jsx`, `src/pages/Dashboard.jsx`, `Profile.jsx`, `Leaderboard.jsx`, `Badges.jsx`, `Challenges.jsx` — fetchen alle aus Supabase, nicht mehr aus `data.js`
- `supabase_schema.sql` — DB-Schema (13 Tabellen + RLS-Policies + Trigger)
- `supabase_seed.sql` — Public reference data (destinations, transport_modes, badges, challenges, …)
- `supabase_demo.sql` — Demo-Inhalt für mein Profil (Level 7, etc.) + 8 Munich-Leaderboard-Seed-Users

**Bitte `supabase_demo.sql` NICHT nochmal laufen lassen** — das würde die Demo-Daten überschreiben.

## Was noch offen ist

- `src/pages/Plan.jsx` — noch aus `data.js`, muss auf Supabase umgestellt werden (Transport / Stay / Eat / Do)
- Auth Guard — `/app/*` Routen sollten unauthenticated User auf `/login` umleiten
- Final GitHub setup für Team-Workflow
- Vercel-Redeploy mit aktueller Codebasis

## Die zwei wichtigsten Supabase-Tricks die ich gelernt hab

1. **Tabellen via SQL Editor erstellt → kein automatisches GRANT.** Manuell laufen lassen:
   ```sql
   grant usage on schema public to anon, authenticated;
   grant select on all tables in schema public to anon, authenticated;
   grant insert, update, delete on all tables in schema public to authenticated;
   ```

2. **supabase-js Web Locks API kann deadlocken** (besonders bei Hot-Reload in Dev). Fix in `createClient`:
   ```js
   { auth: { lock: async (_, _, fn) => fn() } }
   ```

Schreib mir Bescheid wenn was nicht läuft.

— Davide
