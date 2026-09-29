# Path 3 Plan — Native Screen-Time (Capacitor)

Goal: give the Scroll Detect PWA access to **real per-app screen time** on phones
(Android first; iOS is restricted and may not be possible — see Risks).

This document is a plan only. No code was changed by writing it.

## Why this path exists

The PWA can only time its own page. Android's `UsageStatsManager` is the only
practical source of "time spent inside Instagram/TikTok/etc." Apple does not
expose per-app screen time publicly, so iOS support is limited (see Risks).

## Architecture

```
[ Android: UsageStatsManager ]
            │  (native plugin)
            ▼
[ Capacitor plugin → emits Session objects ]      ← lib/engine/types.ts shape
            │
            ▼
[ Scroll Detect PWA: /app dashboard ]             ← detection → insights → predictions
            (ingest via /api/ingest or localStorage feed)
```

## Data contract (unchanged)

The engine already consumes exactly what a native plugin produces:

```ts
Session = { id, app, category, startAt, endAt, moodBefore?, moodAfter?, note?, source }
```

`category` maps Android package → our Category (`social`, `video`, `shorts`, …).
Packages outside the catalog fall back to `other`. No engine changes required.

## Phase breakdown

| Phase | Work | Effort |
|---|---|---|
| 1. Wrap the PWA | Add Capacitor (`npx cap init`), point it at the built `next export` output | Small |
| 2. Permissions + plugin | Add Android `PACKAGE_USAGE_STATS` permission; request "Usage access" consent screen | Small |
| 3. Stats plugin | Bridge `UsageStatsManager.queryUsageStats()` into a Capacitor plugin method that returns `Session[]` | Medium |
| 4. Ingest | `POST { sessions }` → `/api/ingest` (validates + stores), or native plugin writes to the same localStorage the dashboard reads | Medium |
| 5. Sync loop | Every N minutes / on app foreground, diff last sync cursor, push new sessions | Small |
| 6. iOS decision gate | If iOS per-app time is impossible, iOS build ships with the PWA-only away-tracker | — |

Existing features work unchanged once sessions are ingested: interventions,
insights, trigger analysis, predictions, coach context, away-tracker merge.

## Consent & privacy

- `UsageStatsManager` requires the user to explicitly grant "Usage access" in
  Android settings — in-app prompt must explain exactly why.
- All session data stays on-device (localStorage already); cloud sync would be a
  separate, opt-in decision.
- Store listing: Play review expects a clearly visible privacy statement about
  usage-stats collection.

## Risks

- **iOS**: pport per-app screen-time API does not exist for third parties.
  Only option on iOS is the PWA away-tracker (measures time away from the app,
  not which app). Document this in the store copy.
- Android package names/OS versions vary; `queryUsageStats` needs a
  rounding/window buffer and a per-day aggregation step.
- `next export` is required for Capacitor (or moving to a SSR deployment served
  in WebView); static export removes `/api/coach` (LLM) — would route ingests
  and coach calls to an external API instead.