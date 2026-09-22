# Path 2 Prototype — Browser Extension (tab time → scroll sessions)

Fully standalone prototype. It does **not** touch the Next.js app:

- `manifest.json`  — Chrome / Edge / Brave (Manifest V3)
- `background.js`  — service worker that tracks how long a browsing tab is active
- `popup.html` + `popup.js` — toolbar popup showing today's time per social site with an "Export sessions" button

## How to load it (unpacked)

1. Chrome → `chrome://extensions`
2. Toggle **Developer mode** on
3. **Load unpacked** → select this folder
4. Pin the extension, open the popup

## What it does

- Only observes **tab URL + timer values**; reads nothing from page content, stores nothing about the page.
- Accumulates active time per short domain (`twitter.com`, `instagram.com`, `tiktok.com`, `youtube.com`, `reddit.com`, `facebook.com`, `threads.net`) in `chrome.storage.local`.
- Passes any tab switch to a "background" timer: when a tab is deactivated/removed, writes the delta.

## Limits (be honest in UI)

- Desktop web **only** — never the native apps.
- Measures how long the tab is *open and active*, not exactly "scrolling".
- Requires the user to install the extension manually.

## Integrating with Scroll Detect's engine (wired in)

The dashboard already imports this data. Once an ingest endpoint exists OR
automatically: click **Send to dashboard** in the extension popup.

- The popup base64-encodes today's tracked sessions as a `?import=` query
  parameter on `/app`.
- `lib/import-sessions.ts` reads that param on mount, validates every session,
  dedupes by id, and writes to the same `localStorage` the dashboard reads.
- A confirmation banner shows "Imported N scroll sessions".

This keeps the on-device design intact — no server storage required.