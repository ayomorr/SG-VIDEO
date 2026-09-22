/** Small shared formatting + time helpers for the AI engine. */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export function formatDuration(ms: number): string {
  if (ms < MINUTE) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < HOUR) {
    const minutes = Math.round(ms / MINUTE);
    return `${minutes} min`;
  }
  const hours = Math.floor(ms / HOUR);
  const minutes = Math.round((ms % HOUR) / MINUTE);
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function formatHour(hour: number, minute = 0): string {
  const normalized = ((Math.floor(hour) % 24) + 24) % 24;
  const label = String(normalized % 12 === 0 ? 12 : normalized % 12).padStart(2, "0");
  const min = String(Math.floor(minute)).padStart(2, "0");
  return `${label}:${min} ${normalized >= 12 ? "PM" : "AM"}`;
}

export function formatRange(
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
): string {
  return `${formatHour(startHour, startMin)} – ${formatHour(endHour, endMin)}`;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hourOf(ms: number): number {
  return new Date(ms).getHours();
}

export function startOfDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function dayKey(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isLateNight(hour: number, startHour: number, endHour: number): boolean {
  if (startHour <= endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}
