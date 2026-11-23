"use client";
import { createContext, useContext } from "react";
import type { Change } from "@/lib/diff";
import type { BotForm, Errors, Mode, SkillDraft } from "@/lib/types";

export interface WizardCtx {
  d: BotForm;
  mode: Mode;
  step: number;
  maxStep: number;
  errors: Errors;
  err: (key: string) => string;
  touch: (key: string) => void;
  set: (path: string, value: unknown) => void;
  update: (fn: (draft: BotForm) => void) => void;
  skillDraft: SkillDraft | null;
  setSkillDraft: (k: SkillDraft | null) => void;
  adv: boolean;
  setAdv: (open: boolean) => void;
  agentsLoading: boolean;
  go: (i: number, focus?: string) => void;
  toast: (msg: string) => void;
  stepErrors: (i: number) => string[];
  issueKeys: () => string[];
  stepStatus: (i: number) => "current" | "done" | "error" | "todo";
  /** What differs from the saved bot (edit mode only). */
  changes: Change[];
}

export const Wizard = createContext<WizardCtx | null>(null);

export function useWiz(): WizardCtx {
  const c = useContext(Wizard);
  if (!c) throw new Error("useWiz must be used inside <BotWizard>");
  return c;
}
