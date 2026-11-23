export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const BOT_TYPES: [string, string][] = [
  ["Sales Lead Generation", "Captures and qualifies new leads from the client’s website visitors."],
  ["Customer Support", "Answers questions and helps the client’s customers solve problems."],
  ["Smart Ordering", "Guides the client’s customers through placing an order."],
  ["Clinic", "Books and manages appointments for the client’s clinic."],
];
export const TYPE_LABEL: Record<string, string> = { Clinic: "Clinic Appointment" };

export const INDUSTRIES = ["Retail", "FnB", "Dental and Clinics", "Healthcare", "Infrastructure", "Oil and Gas"];

export const TZ: [string, string][] = [
  ["Asia/Kolkata", "India Standard Time (UTC+05:30)"],
  ["Asia/Dubai", "Gulf Standard Time (UTC+04:00)"],
  ["Asia/Singapore", "Singapore Time (UTC+08:00)"],
  ["Europe/London", "London (UTC+00:00)"],
  ["UTC", "Coordinated Universal Time (UTC)"],
  ["America/New_York", "Eastern Time (UTC-05:00)"],
  ["America/Los_Angeles", "Pacific Time (UTC-08:00)"],
];

export const LANGS: [string, string][] = [
  ["Arabic", "ar"], ["Bangla", "bn"], ["English", "en"], ["French", "fr"], ["German", "de"], ["Hindi", "hi"],
  ["Japanese", "ja"], ["Korean", "ko"], ["Spanish", "es"], ["Tamil", "ta"], ["Telugu", "te"],
];

export const AGENTS = [
  { id: "agt-support", name: "Support Concierge", desc: "Handles product questions and everyday support requests." },
  { id: "agt-sales", name: "Sales Qualifier", desc: "Asks the right questions to qualify and route new leads." },
  { id: "agt-booking", name: "Booking Assistant", desc: "Finds open slots and confirms appointments." },
  { id: "agt-orders", name: "Order Helper", desc: "Builds orders, checks stock and confirms details." },
];

export const STORAGE = [
  { id: "st-eastus-01", name: "Primary storage (East US)" },
  { id: "st-eastus2-02", name: "Backup storage (East US 2)" },
  { id: "st-westeu-03", name: "EU storage (West Europe)" },
];

export const STEPS = [
  { t: "Basics", d: "Name, look and purpose", h: "Set up the bot basics", s: "Name the bot and say what it will do for this client. You can change all of this later." },
  { t: "Languages & chat", d: "How it talks to their customers", h: "Languages & conversation", s: "Choose the languages the client’s customers can chat in and how conversations behave." },
  { t: "Agent or skills", d: "What answers their customers", h: "Agent or skills", s: "Set up what answers the client’s customers, depending on who answers first." },
  { t: "Live agent", d: "When their team takes over", h: "Live agent handover", s: "Set when the client’s team is available to take over from the bot." },
  { t: "Plan & storage", d: "Subscription, storage, advanced", h: "Plan, storage & advanced", s: "Add your Chargebee subscription ID to track this client’s plan, and choose where the bot’s files are stored. Technical settings are pre-filled for you." },
  { t: "Review", d: "Check everything", h: "Review & save", s: "Take a last look before saving the bot for the client. Use Edit on any card to change something." },
];

export const REVIEW = STEPS.length - 1;

export const COUNTRIES: [string, string][] = [
  ["IN", "India (+91)"], ["AE", "United Arab Emirates (+971)"], ["SG", "Singapore (+65)"], ["MY", "Malaysia (+60)"],
  ["GB", "United Kingdom (+44)"], ["US", "United States (+1)"], ["AU", "Australia (+61)"], ["DE", "Germany (+49)"],
];

/** Step 3 depends on who answers first: skills for a Bot, an agent for an AI Agent. */
export function stepMeta(i: number, routing: string) {
  if (i !== 2) return STEPS[i];
  return routing === "BOT"
    ? { ...STEPS[2], t: "Skills", d: "What the bot can handle", h: "Skills", s: "Skills teach the bot to handle specific requests, like welcoming a customer. Add the ones this client needs." }
    : { ...STEPS[2], t: "AI agent", d: "What powers the bot", h: "Choose the AI agent", s: "The AI agent handles the conversations for this bot. Pick the one that fits the client’s use case." };
}

export const rulesFor = (routing: string): [string, string[], number][] => {
  const r = [...RULES];
  r.splice(4, 0, routing === "BOT" ? ["Skills", ["skillDraftOpen"], 2] : ["AI agent", ["agentId"], 2]);
  return r;
};

export const ADV = ["cxBaseUrl", "legacyId", "legacyName", "lg"];

export const RULES: [string, string[], number][] = [
  ["Name & picture", ["name", "picture"], 0],
  ["Type, industry & timezone", ["botType", "industry", "timezone"], 0],
  ["Languages", ["languages"], 1],
  ["Chat settings", ["expiry", "routing"], 1],
  ["Live agent setup", ["lh.timezone", "hours", "hour.*", "wait", "mode"], 3],
  ["Subscription", ["chargebeeId"], 4],
  ["Storage", ["storageId"], 4],
  ["Advanced settings", ["cxBaseUrl", "legacyId", "legacyName", "lg"], 4],
];
