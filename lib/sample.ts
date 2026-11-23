import { allHours, langName, newBotId } from "./helpers";
import type { BotRow } from "./bots";
import type { BotForm } from "./types";

export function freshBot(): BotForm {
  return {
    name: "",
    picture: "",
    botType: "",
    industry: "",
    timezone: "",
    defaultCountryCode: "",
    botId: newBotId(),
    cxBaseUrl: "https://cx.inflow.example",
    languages: [{ name: "English", code: "en" }],
    defaultLanguage: "en",
    routing: "BOT",
    expiryValue: 4,
    expiryUnit: "hour",
    feedback: true,
    agentId: "",
    skills: [],
    lh: { timezone: "", tzTouched: false, hours: allHours(true), waitMin: 2, modeMin: 30, joinMsg: true, leaveMsg: true },
    chargebeeId: "",
    storageId: "",
    legacyId: "",
    legacyName: "",
    lg: "",
  };
}

export function sampleBot(): BotForm {
  const hours = allHours(true);
  hours[5].start = "10:00";
  hours[5].end = "14:00";
  hours[6].available = false;
  return {
    name: "Enquiry Bot",
    picture: "avatar-3",
    botType: "Customer Support",
    industry: "Healthcare",
    timezone: "Asia/Kolkata",
    defaultCountryCode: "IN",
    botId: "bot-x7Kq29LmPa3",
    cxBaseUrl: "https://cx.inflow.example",
    languages: [
      { name: "English", code: "en" },
      { name: "Tamil", code: "ta" },
      { name: "Hindi", code: "hi" },
    ],
    defaultLanguage: "en",
    routing: "AI-AGENT",
    expiryValue: 4,
    expiryUnit: "hour",
    feedback: true,
    agentId: "agt-support",
    skills: [
      { name: "WELCOME", intent: "welcome", config: '{\n  "timeout": 10\n}', enabled: true },
      { name: "BOOK_SLOT", intent: "book_slot", config: '{\n  "durationMins": 30\n}', enabled: true },
    ],
    lh: { timezone: "Asia/Kolkata", tzTouched: true, hours, waitMin: 2, modeMin: 30, joinMsg: true, leaveMsg: false },
    chargebeeId: "sub_AzZ12abc34",
    storageId: "st-eastus-01",
    legacyId: "",
    legacyName: "",
    lg: "",
  };
}

const SKILL_POOL = [
  { name: "WELCOME", intent: "welcome", config: '{\n  "timeout": 10\n}', enabled: true },
  { name: "BOOK_SLOT", intent: "book_slot", config: '{\n  "durationMins": 30\n}', enabled: true },
  { name: "FAQ", intent: "faq", config: '{\n  "topK": 3\n}', enabled: true },
  { name: "HANDOVER", intent: "live_agent_handover", config: '{\n  "queue": "default"\n}', enabled: false },
  { name: "COLLECT_FEEDBACK", intent: "feedback", config: '{\n  "scale": 5\n}', enabled: true },
];

/** Builds the full bot configuration for a list row (prototype data: the rest comes from the sample bot). */
export function botFromRow(row: BotRow): BotForm {
  const b = sampleBot();
  const codes = row.languages.length ? row.languages : ["en"];
  return {
    ...b,
    name: row.name,
    botId: row.botId,
    picture: `avatar-${row.avatar + 1}`,
    botType: row.botType,
    industry: row.industry,
    timezone: row.timezone,
    routing: row.routing,
    languages: codes.map((code) => ({ code, name: langName(code) })),
    defaultLanguage: codes[0],
    skills: SKILL_POOL.slice(0, row.skills),
    agentId: row.routing === "AI-AGENT" ? b.agentId || "agt-support" : "",
    lh: { ...b.lh, timezone: row.timezone },
  };
}
