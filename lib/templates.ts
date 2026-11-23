import { allHours } from "./helpers";
import type { BotForm, Skill } from "./types";

export interface BotTemplate {
  id: string;
  title: string;
  desc: string;
  botType: string;
  routing: "BOT" | "AI-AGENT";
  agentId: string;
  languages: string[];
  skills: Skill[];
  /** [first day, last day, start, end]; 0 = Monday */
  hours: [number, number, string, string][];
  waitMin: number;
  modeMin: number;
  /** Human-readable list of what gets pre-filled. */
  includes: string[];
}

const sk = (name: string, intent: string, config: object): Skill => ({ name, intent, config: JSON.stringify(config, null, 2), enabled: true });

export const TEMPLATES: BotTemplate[] = [
  {
    id: "support", title: "Customer Support", desc: "Typical settings for a client’s support bot: an AI agent answers first, with weekday live agent hours.",
    botType: "Customer Support", routing: "AI-AGENT", agentId: "agt-support", languages: ["en"],
    skills: [sk("WELCOME", "welcome", { timeout: 10 }), sk("FAQ", "faq", { topK: 3 }), sk("HANDOVER", "live_agent_handover", { queue: "default" })],
    hours: [[0, 4, "09:00", "18:00"]], waitMin: 3, modeMin: 30,
    includes: ["Routing: AI Agent", "Support Concierge agent", "Mon–Fri 9–6 handover hours"],
  },
  {
    id: "sales", title: "Sales Lead Generation", desc: "Typical settings for a client’s lead-capture bot: an AI agent qualifies website visitors, with live agent hours.",
    botType: "Sales Lead Generation", routing: "AI-AGENT", agentId: "agt-sales", languages: ["en"],
    skills: [sk("WELCOME", "welcome", { timeout: 10 }), sk("CAPTURE_LEAD", "capture_lead", { fields: ["name", "email", "phone"] }), sk("HANDOVER", "live_agent_handover", { queue: "sales" })],
    hours: [[0, 4, "09:00", "19:00"]], waitMin: 2, modeMin: 20,
    includes: ["Routing: AI Agent", "Sales Qualifier agent", "Mon–Fri 9–7 handover hours"],
  },
  {
    id: "ordering", title: "Smart Ordering", desc: "Typical settings for a client’s ordering bot: order and order-status skills, daily hours.",
    botType: "Smart Ordering", routing: "BOT", agentId: "agt-orders", languages: ["en"],
    skills: [sk("WELCOME", "welcome", { timeout: 10 }), sk("TAKE_ORDER", "take_order", { maxItems: 20 }), sk("ORDER_STATUS", "order_status", {})],
    hours: [[0, 6, "10:00", "22:00"]], waitMin: 2, modeMin: 15,
    includes: ["Routing: Bot", "3 skills", "Daily 10–10 handover hours"],
  },
  {
    id: "clinic", title: "Clinic Appointment", desc: "Typical settings for a client’s clinic bot: booking and reschedule skills.",
    botType: "Clinic", routing: "BOT", agentId: "agt-booking", languages: ["en"],
    skills: [sk("WELCOME", "welcome", { timeout: 10 }), sk("BOOK_SLOT", "book_slot", { durationMins: 30 }), sk("RESCHEDULE", "reschedule", { allowedHoursBefore: 24 }), sk("HANDOVER", "live_agent_handover", { queue: "reception" })],
    hours: [[0, 4, "09:00", "18:00"], [5, 5, "09:00", "14:00"]], waitMin: 2, modeMin: 30,
    includes: ["Routing: Bot", "4 skills", "Mon–Sat handover hours"],
  },
];

/** Returns a copy of `base` with the template's settings applied. Name, picture, industry and timezone stay empty. */
export function applyTemplate(base: BotForm, t: BotTemplate): BotForm {
  const hours = allHours(false);
  for (const [from, to, start, end] of t.hours) {
    for (let i = from; i <= to; i++) hours[i] = { ...hours[i], available: true, start, end };
  }
  return {
    ...base,
    botType: t.botType,
    routing: t.routing,
    agentId: t.routing === "AI-AGENT" ? t.agentId : "",
    languages: t.languages.map((code) => ({ code, name: code === "en" ? "English" : code })),
    defaultLanguage: t.languages[0],
    skills: t.routing === "BOT" ? t.skills.map((s) => ({ ...s })) : [],
    lh: { ...base.lh, hours, waitMin: t.waitMin, modeMin: t.modeMin },
  };
}
