# OurStory

A private, free family timeline: photos, videos, YouTube links, stories and milestones, on one wandering line.

React + TypeScript + Tailwind (Vite). Supabase for sign-in, the album database and photo/video storage.

**Live:** https://jkrocks.github.io/ourstory/

## Two modes

| Mode | When | Where data lives |
|---|---|---|
| **Preview** | No Supabase keys set | This browser only (IndexedDB). "Explore the sample family" or "Start my album". |
| **Live** | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set | Supabase. Google or email-link sign-in, one shared album per family, invite by code. |

## Go live (about 20 minutes)

### 1. Supabase
1. Create a project at supabase.com (the free plan is enough to start).
2. **SQL Editor → New query**: paste `supabase/schema.sql` and run it. It creates the tables, the family invite functions, row-level security, the private `media` storage bucket and realtime updates.
3. **Authentication → URL Configuration**: set **Site URL** to your live address (e.g. `https://ourstory.vercel.app`) and add it, plus `http://localhost:5173`, under **Redirect URLs**.
4. **Authentication → Providers**
   - **Email** is on by default (magic links). For real use, add your own SMTP under Authentication → SMTP Settings; the built-in sender is rate-limited.
   - **Google**: turn it on and paste a Google OAuth Client ID and secret (Google Cloud Console → APIs & Services → Credentials → OAuth client ID → Web application). Use the callback URL Supabase shows you as the authorised redirect URI.
5. **Project Settings → API**: copy the Project URL and the `anon` public key.

### 2. Run locally
```
cp .env.example .env      # paste the two values
npm install
npm run dev               # http://localhost:5173
```

### 3. Deploy on GitHub Pages (set up)
Every push to `main` builds the site and publishes it to the `gh-pages` branch (`.github/workflows/pages.yml`).
One-time: repo → Settings → Pages → Source **Deploy from a branch**, Branch **gh-pages** / **(root)** → Save.
For live mode add the two Supabase values as repo secrets (Settings → Secrets and variables → Actions → New repository secret), push any change, and add `https://jkrocks.github.io/ourstory/` to Supabase Redirect URLs.

### Or deploy on Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → Add New Project → import the repo. Framework: Vite. Build command `npm run build`, output `dist`.
3. Add the two environment variables from `.env`.
4. Deploy, then put the Vercel address into Supabase's Site URL / Redirect URLs (step 1.3).

Netlify works the same way (build `npm run build`, publish `dist`).

## How families work
- The first person signs in and chooses **Start a new family album**. They become the owner.
- Settings → **Invite family** shows an 8-letter family code and a **Copy invite** button to send on WhatsApp or email.
- Others sign in, choose **Join with a family code**, and see the same album. Changes from one phone show up on the others automatically.

## YouTube links
Add Memory → Video (or any memory) → paste a YouTube link (`youtu.be/…`, `youtube.com/watch?v=…`, Shorts). Long videos stay on YouTube and play inside the memory. Unlisted videos work; private ones don't.

## Storage limits to know
Supabase's free plan includes 1 GB of file storage. Photos are resized to 1800px before upload (~300–500 KB each), so that's a few thousand photos. Phone videos are large: use YouTube (unlisted) for long clips, or move to the Pro plan (100 GB).

## Scripts
- `npm run dev` – local dev server
- `npm run build` – site for hosting, in `dist/`
- `npm run build:preview` – one self-contained HTML file (used for the Claude preview)

## Code map
- `src/lib/auth.tsx` – sign-in, family selection, preview mode
- `src/lib/cloud.ts` – Supabase: load/save album (row diff), realtime, storage
- `src/lib/media.ts` – every photo/video source: demo art, browser, cloud, YouTube
- `src/lib/store.tsx` – app state, navigation, saving
- `src/screens/Login.tsx` – sign-in and family setup
- `src/screens/*`, `src/components/*` – the app
- `supabase/schema.sql` – database, security rules, storage bucket
- `DESIGN.md` – colour, type and component rules
