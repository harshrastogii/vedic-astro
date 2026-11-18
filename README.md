# AstroTalk web app

A free Vedic astrology site. Every chart calculation runs in the browser, with no
wallets or paywalls. Signing in with Google or GitHub (optional) saves profiles and AI chat
history to your account; without signing in, profiles stay in the browser.

- Site: https://astrotalk.space on GitHub Pages (`.github/workflows/pages.yml` builds and deploys on every push to `main`)
- Login and data: Supabase (Google and GitHub sign-in, row-level security so each user only sees their own rows)
- AI chat: `server/api/chat.js` on Vercel, using a free model through Vercel AI Gateway

## Run

```bash
npm install
npm run dev        # http://localhost:5183
npm test           # engine cross-checks against astronomy-engine
npm run build      # static site in dist/ — host anywhere (Netlify, Vercel, Cloudflare Pages…)
```

## Pages

| Route | What it shows |
|---|---|
| `/chat` | AI chat about the active profile's chart; conversations are saved and can be continued |
| `/account` | Sign in with Google or GitHub, sign out |
| `/` | Onboarding form, or a dashboard for the active profile (key placements, current dasha, today's panchang, dosha summary) |
| `/chart` | Rasi (D1) and Navamsa (D9) in North or South Indian style, planet table, houses |
| `/dasha` | Vimshottari mahadasha → antardasha → pratyantar, with the current period highlighted |
| `/panchang` | Any date and place: five limbs with end times, sunrise/sunset, muhurtas, choghadiya, lunar month, samvat |
| `/doshas` | Mangal, Kaal Sarp, Pitra, Sade Sati |
| `/matching` | Ashtakoot (36 guna) score for two profiles |
| `/profiles` | Add, edit, delete and switch profiles |

## Where things live

- `src/engine/` — the astrology engine. See `src/engine/CHANGES.md` for each fix made to the original.
- `src/lib/` — timezone handling, place search, profile storage, glue between engine and UI.
- `src/components/`, `src/pages/` — the interface.
- Rename the app in one place: `APP_NAME` in `src/components/Layout.jsx` (plus `<title>` in `index.html`).

Place search: a built-in city list works offline; other places come from the free
Open-Meteo geocoding API (no key). Only the typed place name is sent.

## Chat server (`server/`)

A Vercel project with root directory `server`. Environment variables:

| Name | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Verify the caller's login |
| `ALLOWED_ORIGINS` | Sites allowed to call the API (CORS) |
| `CHAT_MODEL`, `CHAT_FALLBACK_MODELS` | Optional. Default `nvidia/nemotron-3.5-lightning-free`, fallback `reflection/beam-free` |

AI Gateway authenticates automatically on Vercel (OIDC), so no AI key is stored.
