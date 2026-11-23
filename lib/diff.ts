import { COUNTRIES } from "./constants";
import { agentById, expiryText, hoursSummary, langName, storageById, tzLabel, typeLabel } from "./helpers";
import type { BotForm } from "./types";

export interface Change {
  label: string;
  from: string;
  to: string;
}

const onOff = (b: boolean) => (b ? "On" : "Off");
const country = (c: string) => COUNTRIES.find(([code]) => code === c)?.[1] ?? "";

/** Human-readable list of what differs between the saved bot (a) and the edited bot (b). */
export function diffBot(a: BotForm, b: BotForm): Change[] {
  const out: Change[] = [];
  const row = (label: string, x: string, y: string) => {
    if (x !== y) out.push({ label, from: x || "Not set", to: y || "Not set" });
  };

  row("Name", a.name, b.name);
  row("Type", typeLabel(a.botType), typeLabel(b.botType));
  row("Industry", a.industry, b.industry);
  row("Timezone", tzLabel(a.timezone), tzLabel(b.timezone));
  row("Default country", country(a.defaultCountryCode), country(b.defaultCountryCode));
  row("Languages", a.languages.map((l) => l.name).join(", "), b.languages.map((l) => l.name).join(", "));
  row("Default language", langName(a.defaultLanguage), langName(b.defaultLanguage));
  row("Answers first", a.routing === "BOT" ? "Bot" : "AI Agent", b.routing === "BOT" ? "Bot" : "AI Agent");
  row("Idle chats end after", expiryText(a), expiryText(b));
  row("Feedback on replies", onOff(a.feedback), onOff(b.feedback));
  row("AI agent", agentById(a.agentId)?.name ?? "", agentById(b.agentId)?.name ?? "");

  const before = new Map(a.skills.map((s) => [s.name, s]));
  const after = new Map(b.skills.map((s) => [s.name, s]));
  for (const [name, s] of after) {
    const old = before.get(name);
    if (!old) out.push({ label: "Skill " + name, from: "Not set", to: "Added" });
    else {
      if (old.enabled !== s.enabled) out.push({ label: "Skill " + name, from: onOff(old.enabled), to: onOff(s.enabled) });
      if (old.intent !== s.intent) out.push({ label: "Skill " + name + " intent", from: old.intent, to: s.intent });
      if (old.config !== s.config) out.push({ label: "Skill " + name + " configuration", from: "Previous", to: "Updated" });
    }
  }
  for (const name of before.keys()) if (!after.has(name)) out.push({ label: "Skill " + name, from: "Added", to: "Removed" });

  row("Live agent hours", hoursSummary(a.lh.hours), hoursSummary(b.lh.hours));
  row("Live agent timezone", tzLabel(a.lh.timezone), tzLabel(b.lh.timezone));
  row("Waits up to", a.lh.waitMin + " min", b.lh.waitMin + " min");
  row("Live chat length", a.lh.modeMin + " min", b.lh.modeMin + " min");
  row("Join message", onOff(a.lh.joinMsg), onOff(b.lh.joinMsg));
  row("Leave message", onOff(a.lh.leaveMsg), onOff(b.lh.leaveMsg));

  row("Subscription ID", a.chargebeeId, b.chargebeeId);
  row("Storage", storageById(a.storageId)?.name ?? "", storageById(b.storageId)?.name ?? "");
  row("CX base URL", a.cxBaseUrl, b.cxBaseUrl);
  row("Legacy bot", [a.legacyName, a.legacyId].filter(Boolean).join(" · "), [b.legacyName, b.legacyId].filter(Boolean).join(" · "));
  if (a.lg.trim() !== b.lg.trim()) out.push({ label: "LG templates", from: a.lg.trim() ? "Previous" : "Not set", to: b.lg.trim() ? "Updated" : "Removed" });

  return out;
}
