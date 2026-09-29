# AGENTS.md

Guidance for AI agents working in this repository.

## Interaction

- **Ask yes/no questions only.** When something needs confirming, offer two
  options — a yes and a no. Do not present "I don't know", "probably not", or
  other non-committal answers, and do not enable free-text responses on
  question prompts.
- Keep updates short. Lead with what changed and what broke, not a narrative of
  every step taken.

## Commands

```bash
npm run dev        # dev server on http://localhost:3010
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # next build
```

## Gotchas

- **Never run `npm run build` while `npm run dev` is running.** Both write to
  the same `.next` directory. The production build overwrites the dev server's
  chunks, and the app then returns HTTP 200 while its JavaScript 404s — a blank
  page that looks healthy if you only check status codes. To recover: kill the
  `SG VIDEO` node processes, delete `.next`, restart the dev server.
- The dev port is **3010**, not 3000. Ports 3000/3001/3002 belong to other
  projects on this machine.
- This repo sits inside OneDrive, which can surface confusing `EINVAL` on
  `.next` paths. Deleting `.next` usually clears it.
- Verify a page by fetching its JS chunks, not just its status code:

  ```powershell
  $r = Invoke-WebRequest http://localhost:3010/app -UseBasicParsing
  [regex]::Matches($r.Content,'src="([^"]+\.js)"') | ForEach-Object {
    Invoke-WebRequest ("http://localhost:3010" + $_.Groups[1].Value) -UseBasicParsing
  }
  ```

## Audio

- Alarm recordings live in `public/audio/`: `siren.mp3` and `screech.mp3`.
  The user can switch between them; the truck horn was removed and its stale
  `localStorage` value is cleaned up on load.
- Both are LAME-encoded MP3s. The frame at the start is a Xing/Info VBR
  header, not audio — a naive frame walker desyncs on it and then "finds" bogus
  frames in the payload. Real audio starts about 1250 bytes in.
- Alarm volume defaults to 1 and there is no volume UI. A persisted
  `scrolldictive.alarm.volume.v1` of `0` would still silence it, so clear that
  key if the alarm is unexpectedly mute.
- Guard against `Number(null) === 0` when reading `localStorage` — an absent
  key must not coerce to a real value. This bug previously made every new
  user's alarm silent.
