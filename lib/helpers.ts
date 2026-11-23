import { AGENTS, DAYS, LANGS, STORAGE, TYPE_LABEL, TZ } from "./constants";
import type { BotForm, Hour } from "./types";

export function getP(o: any, p: string): any {
  return p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
}

export function setP(o: any, p: string, v: unknown) {
  const ks = p.split(".");
  let a = o;
  while (ks.length > 1) a = a[ks.shift() as string];
  a[ks[0]] = v;
}

export function newBotId() {
  const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "bot-";
  for (let i = 0; i < 11; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

export const allHours = (on: boolean): Hour[] =>
  DAYS.map((day) => ({ day, available: on, start: "09:00", end: "18:00" }));

export function fmt12(t: string) {
  if (!t) return "—";
  const [hh, m] = t.split(":");
  let h = +hh;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

export const tzLabel = (v: string) => TZ.find((t) => t[0] === v)?.[1] ?? v;
export const typeLabel = (v: string) => TYPE_LABEL[v] ?? v;
export const langName = (c: string) => LANGS.find((l) => l[1] === c)?.[0] ?? c;
export const agentById = (id: string) => AGENTS.find((a) => a.id === id);
export const storageById = (id: string) => STORAGE.find((s) => s.id === id);

export function hoursSummary(hrs: Hour[]) {
  const out: string[] = [];
  let i = 0;
  while (i < 7) {
    const h = hrs[i];
    if (!h.available) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < 7 && hrs[j + 1].available && hrs[j + 1].start === h.start && hrs[j + 1].end === h.end) j++;
    const r = i === 0 && j === 6 ? "Every day" : i === j ? DAYS[i].slice(0, 3) : `${DAYS[i].slice(0, 3)}–${DAYS[j].slice(0, 3)}`;
    out.push(`${r} ${fmt12(h.start)}–${fmt12(h.end)}`);
    i = j + 1;
  }
  return out.length ? out.join(" · ") : "No days selected";
}

const UNIT_SECONDS = { sec: 1, min: 60, hour: 3600, day: 86400 } as const;

export function expirySeconds(d: BotForm): number {
  return d.expiryValue === "" ? NaN : d.expiryValue * UNIT_SECONDS[d.expiryUnit];
}

export function expiryText(d: BotForm) {
  const s = expirySeconds(d);
  if (isNaN(s)) return "—";
  if (s && s % 86400 === 0) return `${s / 86400} day${s / 86400 > 1 ? "s" : ""}`;
  if (s && s % 3600 === 0) return `${s / 3600} hour${s / 3600 > 1 ? "s" : ""}`;
  if (s && s % 60 === 0) return `${s / 60} min`;
  return `${s} sec`;
}

export function jsonState(txt: string): "empty" | "ok" | "bad" {
  if (!txt.trim()) return "empty";
  try {
    JSON.parse(txt);
    return "ok";
  } catch {
    return "bad";
  }
}
