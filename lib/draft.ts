import type { BotForm } from "./types";

/** Short banner shown at the top of the wizard ("Started from…", "Duplicated from…"). */
export interface Note {
  title: string;
  text: string;
}

export interface Draft {
  d: BotForm;
  step: number;
  maxStep: number;
  note: Note | null;
  client: string;
  savedAt: number;
}

const KEY = "bw-draft";

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const x = JSON.parse(raw) as Draft;
    return x && x.d && typeof x.step === "number" ? x : null;
  } catch {
    return null;
  }
}

export function saveDraft(x: Draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(x));
  } catch {
    /* storage unavailable: drafts are a convenience only */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Only keep a draft once the user has actually entered something. */
export const worthSaving = (d: BotForm, step: number) =>
  step > 0 || !!(d.name.trim() || d.picture || d.botType || d.industry || d.timezone);

export function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const dd = Math.floor(h / 24);
  return dd + (dd === 1 ? " day ago" : " days ago");
}
