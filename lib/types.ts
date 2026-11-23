export interface Hour {
  day: string;
  available: boolean;
  start: string;
  end: string;
}

export interface Skill {
  name: string;
  intent: string;
  config: string;
  enabled: boolean;
}

export interface Language {
  name: string;
  code: string;
}

export type NumField = number | "";
export type ExpiryUnit = "sec" | "min" | "hour" | "day";

export interface BotForm {
  name: string;
  picture: string;
  botType: string;
  industry: string;
  timezone: string;
  defaultCountryCode: string;
  botId: string;
  cxBaseUrl: string;
  languages: Language[];
  defaultLanguage: string;
  routing: "BOT" | "AI-AGENT";
  expiryValue: NumField;
  expiryUnit: ExpiryUnit;
  feedback: boolean;
  agentId: string;
  skills: Skill[];
  lh: {
    timezone: string;
    tzTouched: boolean;
    hours: Hour[];
    waitMin: NumField;
    modeMin: NumField;
    joinMsg: boolean;
    leaveMsg: boolean;
  };
  chargebeeId: string;
  storageId: string;
  legacyId: string;
  legacyName: string;
  lg: string;
}

export interface SkillDraft {
  index: number | null;
  name: string;
  intent: string;
  config: string;
  enabled: boolean;
  attempted: boolean;
}

export type Mode = "add" | "edit";
export type Errors = Record<string, string>;
