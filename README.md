# Scroll Detect

> Scroll smarter. Live more.

Scroll Detect is an installable (PWA) web app that helps people break doomscrolling loops. It lets users log their own scrolling sessions — recommend never tracking them automatically — then applies on-device analytics to surface triggers, predict high-risk evenings, and run a gentle break timer that tells you when to close the feed.

Everything about a user's browsing history stays out of the server. Sessions, insights, and timer state live only in the browser (localStorage / IndexedDB-backed store). The only server code is two small API routes.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS 3 + shadcn-style UI primitives (Radix UI) |
| Animation | framer-motion |
| PWA | `public/sw.js` (offline shell + notification handling) + `app/manifest.ts` |
| Backend | Next.js Route Handlers (`app/api/*`) — Node runtime |
| Analytics engine | Pure TypeScript rule-based modules in `lib/engine/*` (no network) |

## Project layout

```
app/
  (site)/               Landing page group (Hero → How it works → FAQ → CTA)
    page.tsx            Homepage
    layout.tsx          Marketing chrome (navbar, footer, sticky install bar)
  app/page.tsx          The dashboard UI (the PWA), isolated from marketing chrome
  api/
    coach/route.ts      POST — coach chat reply (LLM if configured, else rules engine)
    join/route.ts       POST — early-access signup (validates email)
  layout.tsx            Root layout: fonts, theme providers, SEO + JSON-LD
  manifest.ts           Web App Manifest
components/
  marketing/            Landing page components (hero, navbar, footer, FAQ, CTAs…)
  dashboard/             Dashboard UI (dashboard-client, timer-tab, live-scroll-tab)
  ui/                   Reusable primitives (button, card, accordion)
lib/
  engine/               Detection, triggers, insights, predictions, coach, demo data (pure functions)
  hooks/                use-break-timer, use-away-tracker, use-install-state
  store.ts              Client-side session store (subscribe/emit)
  llm.ts                Server-only OpenAI-compatible client (env-configurable)
public/
  sw.js                 Service worker (offline+notifications)
scripts/                Dev tooling (icon/OG generation, local start scripts)
extension-prototype/    Standalone browser-extension concept (not part of the app)
```

## Getting started

Requirements: Node.js 18.18 (or newer) and npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint (next/core-web-vitals + next/typescript)
```

Type-check explicitly with `npx tsc --noEmit`.

## Backend API

Both routes return JSON and use `POST`.

### `POST /api/coach`

Front-end coach chat. Accepts a small message history and optional context.

```json
{ "messages": [{ "role": "user", "content": "..." }], "context": "..." }
```

Response:

```json
{ "ok": true, "reply": "...", "note": "...", "step": "...", "via": "rules" }
```

Behavior:

- Validates and caps the message list (`messages.slice(-12)`).
- If `AI_API_KEY` is set, replies using an OpenAI-compatible model; otherwise falls back to the deterministic rules engine in `lib/engine/coach.ts`.
- Never trusted with arbitrary context length; system prompt keeps replies short and non-clinical.

### `POST /api/join`

Early-access signup. Validates the email format and logs the intent server-side.

```json
{ "email": "you@example.com", "intent": "link" }
```

Response:

```json
{ "ok": true, "intent": "link" }
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in what you need. None are required for the app to run.

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_API_KEY` | *(unset)* | Enables LLM coach replies. When unset, the rules engine answers. |
| `AI_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible `/chat/completions` endpoint. |
| `AI_MODEL` | `gpt-4o-mini` | Model name for coach replies. |
| `NEXT_PUBLIC_SITE_URL` | `https://scrolldictive.app` | Canonical site URL for metadata/SEO. |

## Security notes

- No user data leaves the browser. The `coach` API receives only the message the user typed, never stored sessions.
- Production responses carry security headers from `next.config.mjs`: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and HSTS.
- The service worker (`public/sw.js`) only pre-caches the standalone app shell; it does not forward requests to third parties.

## Deployment

Works on any host that runs `next start` (Vercel, Replit, Node VPS, etc.). The app pages are statically pre-rendered; the two API routes run on the server.

1. `npm run build`
2. `npm run start`

On Vercel, import the repo and it builds automatically — no extra config needed (there is no middleware or edge runtime usage, so deployment is standard).

## Notes for reviewers

- The demo data generator (`lib/engine/demo.ts`) seeds the dashboard with realistic sessions so analytics, triggers, and predictions can be evaluated without real usage.
- The "away/do not touch" tracker (`lib/hooks/use-away-tracker.ts`) is intentionally observation-only policy; bad local habits are never treated as scroll time.
- The browser-extension prototype in `extension-prototype/` is a standalone concept and is not part of the web app.