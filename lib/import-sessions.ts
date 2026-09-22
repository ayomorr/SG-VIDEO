"use client";

import type { Category, Session } from "@/lib/engine/types";
import { addSession, loadSessions } from "@/lib/store";

const VALID_CATEGORIES: Category[] = [
  "social",
  "video",
  "news",
  "shorts",
  "messaging",
  "shopping",
  "gaming",
  "other",
];

const MAX_IMPORT = 500;

function toBase64(str: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

function fromBase64(b64: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)),
  );
}

/** Base64 URL fragment of sessions the dashboard can import. */
export function encodeSessionsForImport(sessions: Session[]): string {
  try {
    return encodeURIComponent(toBase64(JSON.stringify(sessions)));
  } catch {
    return "";
  }
}

/** Full `https://…/app?import=…` URL to open from the extension. */
export function buildImportUrl(
  sessions: Session[],
  base = "https://scrolldictive.app/app",
): string {
  const enc = encodeSessionsForImport(sessions);
  return enc ? `${base}?import=${enc}` : base;
}

/**
 * Reads `?import=` from the current URL and stores any valid, new sessions in
 * the same localStorage pipeline the dashboard reads from. Call once on mount.
 */
export function importSessionsFromQuery(): { imported: number } {
  if (typeof window === "undefined") return { imported: 0 };

  const params = new URLSearchParams(window.location.search);
  const enc = params.get("import");
  if (!enc) return { imported: 0 };

  let raw: string;
  try {
    raw = fromBase64(enc);
  } catch {
    return { imported: 0 };
  }

  let items: unknown;
  try {
    items = JSON.parse(raw);
  } catch {
    return { imported: 0 };
  }
  if (!Array.isArray(items)) return { imported: 0 };

  const existing = new Set(loadSessions().map((s) => s.id));
  let imported = 0;
  const slice = items.slice(0, MAX_IMPORT);
  for (const item of slice) {
    const candidate = item as Partial<Session>;
    if (
      !candidate ||
      typeof candidate.app !== "string" ||
      typeof candidate.startAt !== "number" ||
      typeof candidate.endAt !== "number"
    ) {
      continue;
    }
    const id =
      typeof candidate.id === "string" && candidate.id
        ? candidate.id
        : `imp-${candidate.startAt}-${Math.random().toString(36).slice(2, 8)}`;
    if (existing.has(id)) continue;

    const category: Category = VALID_CATEGORIES.includes(
      candidate.category as Category,
    )
      ? (candidate.category as Category)
      : "other";

    addSession({
      id,
      app: candidate.app,
      category,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      moodBefore: candidate.moodBefore ?? null,
      moodAfter: candidate.moodAfter ?? null,
      note: candidate.note ?? "Imported from browser extension",
      source: "auto",
    });
    existing.add(id);
    imported++;
  }

  return { imported };
}