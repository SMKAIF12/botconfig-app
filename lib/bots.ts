export type Routing = "BOT" | "AI-AGENT";

export interface BotRow {
  botId: string;
  name: string;
  avatar: number; // index used by <Avatar />
  botType: string;
  industry: string;
  timezone: string;
  routing: Routing;
  languages: string[]; // language codes
  skills: number;
  createdAt: string; // ISO date
}

export interface ClientOption {
  id: string;
  name: string;
}

export const CLIENTS: ClientOption[] = [
  { id: "c1", name: "Acme Dental Group" },
  { id: "c2", name: "Northwind Retail" },
  { id: "c3", name: "Globex Healthcare" },
];

const b = (
  botId: string, name: string, avatar: number, botType: string, industry: string,
  timezone: string, routing: Routing, languages: string[], skills: number, createdAt: string,
): BotRow => ({
  botId, name, avatar, botType, industry, timezone, routing, languages, skills, createdAt,
});

export const BOTS: Record<string, BotRow[]> = {
  c1: [
    b("bot-x7Kq29LmPa3", "Enquiry Bot", 3, "Customer Support", "Dental and Clinics", "Asia/Kolkata", "AI-AGENT", ["en", "ta", "hi","ar","fr","ko","ja","es"], 2, "2026-09-14"),
    b("bot-Hd82nQw0Zt1", "Appointment Booker", 6, "Clinic", "Dental and Clinics", "Asia/Dubai", "AI-AGENT", ["en", "ar"], 4, "2026-09-02"),
    b("bot-Lm41xPz9Ke7", "Lead Catcher", 1, "Sales Lead Generation", "Dental and Clinics", "Asia/Singapore", "BOT", ["en"], 3, "2026-08-21"),
    b("bot-Qa90vBn3Ru5", "Recall Reminder", 8, "Clinic", "Healthcare", "Asia/Kolkata", "BOT", ["en", "hi"], 1, "2026-08-05"),
    b("bot-Tf36cYj8Wd2", "Billing Helper", 4, "Customer Support", "Dental and Clinics", "Europe/London", "BOT", ["en"], 0, "2026-07-29"),
    b("bot-Zr58mKs1Vh6", "Whitening Promo Bot", 9, "Sales Lead Generation", "Dental and Clinics", "Asia/Kolkata", "AI-AGENT", ["en", "ta"], 2, "2026-07-11"),
    b("bot-Ny72gDe4Xc0", "Front Desk Assistant", 2, "Customer Support", "Dental and Clinics", "Asia/Dubai", "AI-AGENT", ["en", "ar", "fr"], 5, "2026-06-30"),
    b("bot-Pw15uLq6Jb8", "Feedback Collector", 7, "Customer Support", "Dental and Clinics", "UTC", "BOT", ["en"], 1, "2026-06-12"),
    b("bot-Ek63tHa2Mo9", "Insurance Checker", 5, "Clinic", "Healthcare", "America/New_York", "BOT", ["en", "es"], 0, "2026-05-27"),
    b("bot-Vc47rSi5Gn1", "Referral Programme Bot", 0, "Sales Lead Generation", "Dental and Clinics", "Asia/Singapore", "BOT", ["en"], 2, "2026-05-08"),
    b("bot-Bu29oWf7Yl4", "Post-care Follow-up", 3, "Clinic", "Dental and Clinics", "Asia/Kolkata", "AI-AGENT", ["en", "hi", "ta"], 3, "2026-04-19"),
    b("bot-Jg80zAx3Dp6", "Orthodontics FAQ", 6, "Customer Support", "Dental and Clinics", "Europe/London", "AI-AGENT", ["en", "fr"], 2, "2026-03-30"),
    b("bot-Sk54nCv9Th2", "Walk-in Concierge", 1, "Smart Ordering", "FnB", "Asia/Dubai", "BOT", ["en"], 1, "2026-03-04"),
    b("bot-Oi16eMd0Rq7", "Holiday Hours Bot", 8, "Customer Support", "Dental and Clinics", "UTC", "BOT", ["en"], 0, "2026-02-16"),
  ],
  c2: [
    b("bot-Rn38pTk1Ye5", "Order Assistant", 4, "Smart Ordering", "Retail", "Europe/London", "AI-AGENT", ["en", "fr", "de"], 4, "2026-09-09"),
    b("bot-Wd72cQz6Ha0", "Returns Desk", 9, "Customer Support", "Retail", "Europe/London", "BOT", ["en"], 2, "2026-08-14"),
    b("bot-Fy05lNs8Bu3", "Deal Finder", 2, "Sales Lead Generation", "Retail", "America/New_York", "BOT", ["en", "es"], 1, "2026-07-03"),
  ],
  c3: [],
};

export const ROUTING_LABEL: Record<Routing, string> = { BOT: "Bot", "AI-AGENT": "AI Agent" };

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
