/**
 * The screen freeze that runs once the break reflection is finished.
 *
 * This is a *self-enforced* focus lock, not a device lock — a web app cannot
 * stop someone closing the tab or hitting Back. What it can do is take the
 * whole screen, remove every way out of the page, and hold it for a period the
 * user picked in advance. The end time is persisted, so a refresh mid-freeze
 * resumes it rather than quietly defeating it.
 *
 * The countdown is driven by an absolute wall-clock deadline rather than a
 * decremented counter, so a throttled background tab or a sleeping laptop still
 * unfreezes on time.
 */

/** A freeze shorter than this is not worth the interruption. */
export const FREEZE_MIN_MINUTES = 2;

/** Effectively "as long as the user wants" — a day is long enough to be real. */
export const FREEZE_MAX_MINUTES = 24 * 60;

export const FREEZE_DEFAULT_MINUTES = 5;

const UNTIL_KEY = "scrolldictive.freeze.until.v1";

/** Set on <html> while frozen; the scroll lock lives in globals.css. */
const LOCK_CLASS = "freeze-locked";

let freezing = false;
let endsAt = 0;
let remainingMs = 0;
let tickId: number | null = null;
let everStarted = false;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function readStoredUntil(): number {
  if (typeof localStorage === "undefined") return 0;
  const raw = Number(localStorage.getItem(UNTIL_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function clearStoredUntil() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(UNTIL_KEY);
}

function lockScroll() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add(LOCK_CLASS);
}

function unlockScroll() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(LOCK_CLASS);
}

/**
 * Fullscreen needs a user gesture, and browsers reject the call outright
 * without one. The freeze begins on the tap that answers the last reflection
 * question, so activation is normally still valid — but it expires quickly and
 * is refused in some embedded webviews. The freeze still works without it, so
 * a rejection is logged rather than thrown.
 */
async function goFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) return;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch (err) {
    console.warn(
      "[freeze] fullscreen was refused; the lock will run without it",
      err,
    );
  }
}

async function leaveFullscreen() {
  if (typeof document === "undefined" || !document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    // Nothing to do — the lock is released either way.
  }
}

function computeRemaining(): number {
  return Math.max(0, endsAt - Date.now());
}

function stop(releaseFullscreen: boolean) {
  if (tickId !== null) {
    window.clearInterval(tickId);
    tickId = null;
  }
  if (freezing) {
    freezing = false;
    remainingMs = 0;
    unlockScroll();
    clearStoredUntil();
    if (releaseFullscreen) void leaveFullscreen();
  }
  notify();
}

/** Starts (or restarts) the lock. `durationMs` is clamped to a sane range. */
export function startFreeze(durationMs: number): void {
  if (typeof window === "undefined") return;
  const minutes = Math.min(
    FREEZE_MAX_MINUTES,
    Math.max(FREEZE_MIN_MINUTES, durationMs / 60_000),
  );
  const wasAlreadyFreezing = freezing;

  endsAt = Date.now() + minutes * 60_000;
  remainingMs = computeRemaining();
  freezing = true;
  everStarted = true;

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(UNTIL_KEY, String(endsAt));
  }
  lockScroll();
  void goFullscreen();

  if (tickId !== null) window.clearInterval(tickId);
  tickId = window.setInterval(() => {
    remainingMs = computeRemaining();
    if (remainingMs <= 0) {
      stop(true);
      return;
    }
    notify();
  }, 250);

  if (!wasAlreadyFreezing) notify();
}

/** Ends the lock early. Only used by the countdown finishing or a manual bail. */
export function stopFreeze(): void {
  stop(true);
}

export function isFreezing(): boolean {
  return freezing;
}

export function getFreezeRemainingMs(): number {
  return freezing ? computeRemaining() : remainingMs;
}

/** True once a freeze has ever been started this session, for resume logic. */
export function hasFrozenBefore(): boolean {
  return everStarted;
}

/**
 * Re-arms a freeze that was still running when the page went away. Called once
 * on mount; a no-op when no freeze is outstanding.
 */
export function resumeFreezeIfPending(): boolean {
  if (typeof window === "undefined" || freezing) return freezing;
  const until = readStoredUntil();
  if (until <= 0) return false;
  if (until <= Date.now()) {
    // The window closed after the freeze would have ended. Clear the stale
    // deadline so it cannot re-arm days later.
    clearStoredUntil();
    return false;
  }
  startFreeze(until - Date.now());
  return true;
}

export function subscribeFreeze(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
