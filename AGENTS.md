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

## Monthly goals

- `scrolldictive.profile.v1` holds `{ name, months: { "YYYY-MM": string[] } }`.
  Goals are month-scoped on purpose: a new calendar month arrives with no goals,
  which is what re-triggers the review in `OnboardingGate`. The name is the only
  long-lived field.
- `/app` renders `OnboardingGate` around `DashboardClient`, so the dashboard is
  unreachable until a name plus one goal exist for the current month. Minimum 1
  goal, maximum 5.
- **`BreakReflection` reads `loadGoalProfile()` directly instead of
  `useGoalProfile()`.** That modal mounts the instant the alarm lands, before
  any hook has hydrated; reading through the hook handed the question picker an
  empty profile and silently dropped every goal question.
- Don't persist the name on its own partway through onboarding — the wizard
  writes name and goals together, so an abandoned flow can't leave a name with
  no goals behind it.
- `pickReflectionSession` builds one bank from `REFLECTION_QUESTIONS` plus
  `buildGoalQuestions(...)`, and de-dupes by **prompt**, not by id: generated
  goal questions reuse a small id set, so `goal-align` can legitimately appear
  twice in one session. The same rule applies to React keys on the progress
  dots.

## Question rounds

- A round asks **4–5** questions (`pickReflectionSession(4, 5, ...)`), not the
  1–3 it used to. `BreakReflection` counts its progress dots from
  `session.map(...)`, so one dot is one question.
- The repeat-holdback is capped at `bank.length - minQuestions`. That cap is
  load-bearing, not defensive padding: a user with no goals has a bank of only
  the seven original questions, so an unbounded holdback leaves nothing to ask
  and the round silently serves fewer questions than the caller asked for. It
  was measured serving **one** question instead of four.
- Don't reintroduce an allowance that frees the oldest recent prompts
  ("let the last two back in"). It was sized for 1–3 question rounds; at 4–5 a
  round's memory entry count and the allowance lined up so that it released
  exactly the questions asked *first* in the previous round, and they came back
  immediately. Hold back everything, bounded by the cap above.
- `RECENT_CAP` in `lib/data/goals.ts` is 20 — roughly four rounds. A smaller cap
  makes the holdback useless at this round size. It is safe to exceed the bank
  size because of the holdback cap; the two interact.
- **The alarm must always be dismissible.** `advance()` is the only path to
  `completeReflection()` → `cancel()` → `stopAlarm()`, so every question in the
  session needs at least one enabled control that calls it. The `time` question
  (`minutesInput`) used to disable its Next/Done button until a positive number
  was typed, with no skip. At 1–3 questions that was rare; at 4–5 it landed in
  ~30% of rounds and stranded the user with `alarmPending` still true and the
  alarm ringing forever — including as the *last* question, where the button read
  "Done". `answerMinutes` now always advances and only logs when a valid number
  was typed. Don't gate a control on a field being filled in.

## Goals and branding

- `EXAMPLE_GOALS` in `onboarding-steps.tsx` is deliberately longer than
  `MAX_GOALS`: examples are one-tap suggestions, never a default, and the cap
  only applies to what gets saved. `EXAMPLE_HINTS` holds shorter wording for the
  faded placeholders, because the full example text does not fit an input.
- The brand slogan "Scroll less, live more" is a `slogan` prop on `Logo`, used
  in the navbar and footer. `LogoMark` and `DoomPhoneMark` stay slogan-free so
  the app icon and PWA marks remain legible at small sizes.
