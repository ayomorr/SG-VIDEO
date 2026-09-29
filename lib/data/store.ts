"use client";

import type { Session } from "@/lib/engine/types";
import { generateDemoSessions, STORAGE_KEY } from "@/lib/engine/demo";

type Listener = () => void;

const listeners = new Set<Listener>();

function readStored(): Session[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function write(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage may be unavailable (private mode / quota). Non-fatal.
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadSessions(): Session[] {
  const stored = readStored();
  if (stored) return stored;

  const seed = generateDemoSessions();
  write(seed);
  return seed;
}

export function saveSessions(sessions: Session[]): Session[] {
  write(sessions);
  emit();
  return sessions;
}

export function addSession(session: Session): Session[] {
  const sessions = [...loadSessions(), session].sort(
    (a, b) => a.startAt - b.startAt,
  );
  return saveSessions(sessions);
}

export function deleteSession(id: string): Session[] {
  return saveSessions(loadSessions().filter((session) => session.id !== id));
}

export function resetToDemo(): Session[] {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return saveSessions(generateDemoSessions());
}

export function clearAllData(): Session[] {
  return saveSessions([]);
}

export function hasStoredData(): boolean {
  return Boolean(readStored());
}

export function onSessionsChange(listener: Listener): () => void {
  return subscribe(listener);
}