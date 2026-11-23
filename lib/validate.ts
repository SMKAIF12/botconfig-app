import type { BotForm, Errors, SkillDraft } from "./types";

const isNum = (v: unknown): v is number => v !== "" && v !== null && v !== undefined && !isNaN(v as number);

export function validate(d: BotForm, skillDraftOpen: boolean): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Bot name is required";
  if (!d.picture) e.picture = "Pick a picture for the bot";
  if (!d.botType) e.botType = "Choose what the bot will do";
  if (!d.industry) e.industry = "Select an industry";
  if (!d.timezone) e.timezone = "Select a timezone";

  if (d.languages.length < 1) e.languages = "Add at least one language";
  if (!isNum(d.expiryValue)) e.expiry = "Enter how long before an idle chat ends";
  else if (d.expiryValue < 0) e.expiry = "Must be 0 or more";
  if (!d.routing) e.routing = "Choose who answers first";

  if (d.routing === "AI-AGENT" && !d.agentId) e.agentId = "Choose an AI agent";
  if (skillDraftOpen && d.routing === "BOT") e.skillDraftOpen = "Save or cancel the skill you are adding before continuing";

  if (!d.lh.timezone) e["lh.timezone"] = "Select a timezone";
  if (!d.lh.hours.some((h) => h.available)) e.hours = "Select at least one day the client’s team is available";
  d.lh.hours.forEach((h, i) => {
    if (h.available && (!h.start || !h.end)) e[`hour.${i}`] = "Start and end time are required";
  });
  if (!isNum(d.lh.waitMin)) e.wait = "Enter a number of minutes";
  else if (d.lh.waitMin < 0) e.wait = "Must be 0 or more";
  if (!isNum(d.lh.modeMin)) e.mode = "Enter a number of minutes";
  else if (d.lh.modeMin < 0) e.mode = "Must be 0 or more";

  if (!d.chargebeeId.trim()) e.chargebeeId = "Subscription ID is required";
  if (!d.storageId) e.storageId = "Choose a storage resource";

  if (!d.cxBaseUrl.trim()) e.cxBaseUrl = "CX Base URL is required";
  else if (!/^https?:\/\/.+/.test(d.cxBaseUrl)) e.cxBaseUrl = "Invalid URL format. It should start with http:// or https://";

  const li = d.legacyId.trim();
  const ln = d.legacyName.trim();
  if (li || ln) {
    if (!li) e.legacyId = "Legacy Bot ID is required if a name is provided";
    else if (!/^bot-[a-zA-Z0-9]{11}$/.test(li)) e.legacyId = "Must be “bot-” followed by exactly 11 letters or numbers";
    if (!ln) e.legacyName = "Legacy Bot Name is required if an ID is provided";
  }

  if (d.lg.trim()) {
    try {
      JSON.parse(d.lg);
    } catch {
      e.lg = "Invalid JSON format.";
    }
  }
  return e;
}

export function skillErrors(k: SkillDraft | null): Errors {
  const e: Errors = {};
  if (!k) return e;
  if (!k.name.trim()) e["sk.name"] = "Name is required";
  if (!k.intent.trim()) e["sk.intent"] = "Intent is required";
  if (!k.config.trim()) e["sk.config"] = "Configurations JSON is required";
  else {
    try {
      JSON.parse(k.config);
    } catch {
      e["sk.config"] = "Invalid JSON format.";
    }
  }
  return e;
}

const STEP_OF: Record<string, number> = {
  name: 0, picture: 0, botType: 0, industry: 0, timezone: 0,
  languages: 1, expiry: 1, routing: 1,
  agentId: 2, skillDraftOpen: 2,
  "lh.timezone": 3, hours: 3, wait: 3, mode: 3,
  chargebeeId: 4, storageId: 4,
  cxBaseUrl: 4, legacyId: 4, legacyName: 4, lg: 4,
};

export function stepOf(p: string): number {
  if (p.startsWith("sk.")) return 2;
  if (p.startsWith("hour.")) return 3;
  return STEP_OF[p];
}

export const matches = (pat: string, p: string) => (pat.endsWith(".*") ? p.startsWith(pat.slice(0, -1)) : pat === p);

export const groupOk = (patterns: string[], errors: Errors) =>
  !Object.keys(errors).some((p) => patterns.some((pt) => matches(pt, p)));
