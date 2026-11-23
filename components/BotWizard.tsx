"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ADV, REVIEW, STEPS, stepMeta } from "@/lib/constants";
import { setP, newBotId } from "@/lib/helpers";
import { clearDraft, saveDraft, worthSaving, type Draft, type Note } from "@/lib/draft";
import { diffBot } from "@/lib/diff";
import { AlertCircle, ArrowRight, Bot, Check, ChevronLeft } from "lucide-react";
import type { BotRow } from "@/lib/bots";
import { botFromRow, freshBot, sampleBot } from "@/lib/sample";
import { applyTemplate, type BotTemplate } from "@/lib/templates";
import type { BotForm, Mode, SkillDraft } from "@/lib/types";
import { skillErrors, stepOf, validate } from "@/lib/validate";
import { WIZARD_TOUR } from "@/lib/tours";
import Tour from "./guide/Tour";
import Welcome from "./guide/Welcome";
import PlanView from "./PlanView";
import Rail, { STEP_ICONS } from "./Rail";
import { Wizard, type WizardCtx } from "./ctx";
import StepAI from "./steps/StepAI";
import StepBasics from "./steps/StepBasics";
import StepChat from "./steps/StepChat";
import StepLive from "./steps/StepLive";
import StepPlan from "./steps/StepPlan";
import StepReview from "./steps/StepReview";
import { IconCheck, IconX } from "./ui";
import ConfirmDialog from "./Modal";

const STEP_VIEWS = [StepBasics, StepChat, StepAI, StepLive, StepPlan, StepReview];
const DEFAULT_CLIENT = "Acme Dental Group";

interface BotWizardProps {
  initialMode?: Mode;
  /** Wizard step to open on (edit mode only). */
  initialStep?: number;
  initialBot?: BotRow;
  /** Adds the guided experience for new bots: welcome screen, templates and a one-time tour. */
  guided?: boolean;
  clientName?: string;
  /** Start a new bot as a copy of this one. */
  duplicateOf?: BotRow;
  /** Continue a saved draft. */
  resume?: Draft;
  /** Called when the user leaves the wizard (close/discard, or after a successful save). */
  onExit?: () => void;
}

const dupSeed = (row: BotRow): BotForm => ({ ...botFromRow(row), botId: newBotId(), name: row.name + " (copy)" });

const seed = (m: Mode, row?: BotRow): BotForm => {
  if (m === "add") return freshBot();
  return row ? botFromRow(row) : sampleBot();
};

export default function BotWizard({ initialMode = "add", initialStep = 0, initialBot, guided = false, clientName = DEFAULT_CLIENT, duplicateOf, resume, onExit }: BotWizardProps = {}) {
  const CLIENT_NAME = clientName;
  const [view, setView] = useState<"proto" | "plan">("proto");
  const [phase, setPhase] = useState<"intro" | "wizard">(guided && initialMode === "add" && !resume && !duplicateOf ? "intro" : "wizard");
  const [note, setNote] = useState<Note | null>(
    resume?.note ?? (duplicateOf ? { title: "Duplicated from " + duplicateOf.name + ".", text: "All settings were copied from the client’s existing bot, with a new bot ID and name. Review each step, then add the bot." } : null),
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [noteOpen, setNoteOpen] = useState(true);
  const [tourOn, setTourOn] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [d, setD] = useState<BotForm>(() => (resume ? resume.d : duplicateOf ? dupSeed(duplicateOf) : seed(initialMode, initialBot)));
  const [original, setOriginal] = useState(() => (initialMode === "edit" ? JSON.stringify(seed(initialMode, initialBot)) : ""));
  const [step, setStep] = useState(resume ? resume.step : initialMode === "edit" ? initialStep : 0);
  const [maxStep, setMaxStep] = useState(resume ? resume.maxStep : duplicateOf || initialMode === "edit" ? REVIEW : 0);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [adv, setAdv] = useState(false);
  const [skillDraft, setSkillDraft] = useState<SkillDraft | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const agentsLoaded = useRef(initialMode === "edit" || !!duplicateOf || (resume?.step ?? 0) >= 2);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mainRef = useRef<HTMLElement>(null);

  const errors = useMemo(() => ({ ...validate(d, !!skillDraft), ...skillErrors(skillDraft) }), [d, skillDraft]);

  const shouldShow = (p: string) => {
    if (p.startsWith("sk.")) return !!(touched[p] || skillDraft?.attempted);
    return !!(touched[p] || attempted[stepOf(p)] || step === REVIEW);
  };
  const err = (key: string) => (errors[key] && shouldShow(key) ? errors[key] : "");
  const touch = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));
  const issueKeys = () => Object.keys(errors).filter((p) => !p.startsWith("sk."));
  const stepErrors = (i: number) => issueKeys().filter((p) => stepOf(p) === i);

  const stepStatus = (i: number): "current" | "done" | "error" | "todo" => {
    if (i === step) return "current";
    if (i === REVIEW) return (mode === "edit" || maxStep >= REVIEW) && issueKeys().length === 0 ? "done" : "todo";
    const n = stepErrors(i).length;
    if (attempted[i] && n) return "error";
    const visited = mode === "edit" || i < maxStep;
    return visited && !n ? "done" : "todo";
  };

  const set = useCallback((path: string, value: unknown) => {
    setD((prev) => {
      const n = structuredClone(prev);
      setP(n, path, value);
      if (path === "timezone" && !n.lh.tzTouched) n.lh.timezone = value as string;
      if (path === "lh.timezone") n.lh.tzTouched = true;
      return n;
    });
  }, []);

  const update = useCallback((fn: (draft: BotForm) => void) => {
    setD((prev) => {
      const n = structuredClone(prev);
      fn(n);
      return n;
    });
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2400);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const focusFirstError = () => {
    setTimeout(() => {
      const f = document.querySelector(".field.invalid, .body .err[role='alert']");
      if (!f) return;
      f.scrollIntoView({ block: "center", behavior: "smooth" });
      (f.querySelector("input,select,textarea,button") as HTMLElement | null)?.focus({ preventScroll: true });
    }, 80);
  };

  const moveTo = (i: number, focus?: string) => {
    if (i === REVIEW) setAttempted(Object.fromEntries(Array.from({ length: REVIEW }, (_, n) => [n, true])));
    if (focus && ADV.includes(focus)) setAdv(true);
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
    if (i === 2 && !agentsLoaded.current) {
      agentsLoaded.current = true;
      setAgentsLoading(true);
      setTimeout(() => setAgentsLoading(false), 700);
    }
    document.querySelector(".main .body")?.scrollTo?.({ top: 0 });
    const top = mainRef.current;
    if (top) window.scrollTo({ top: Math.max(0, top.getBoundingClientRect().top + window.scrollY - 90), behavior: "smooth" });
    if (focus) {
      setTimeout(() => {
        const el = document.querySelector(`[id="f-${focus.replace(/\./g, "-")}"]`) as HTMLElement | null;
        el?.focus?.();
      }, 120);
    }
  };

  const go = (i: number, focus?: string) => {
    if (mode === "add" && i > maxStep) return;
    moveTo(i, focus);
  };

  const next = () => {
    const se = stepErrors(step);
    if (se.length) {
      setAttempted((a) => ({ ...a, [step]: true }));
      if (se.some((k) => ADV.includes(k))) setAdv(true);
      toast(`Please fix ${se.length} field${se.length > 1 ? "s" : ""} to continue`);
      focusFirstError();
      return;
    }
    if (step < REVIEW) moveTo(step + 1);
  };

  const submit = () => {
    const issues = issueKeys();
    if (issues.length) {
      toast("Fix the highlighted items first");
      // Saving from a step other than Review: take the user to the first problem.
      if (step !== REVIEW) {
        setAttempted((a) => ({ ...a, [stepOf(issues[0])]: true }));
        moveTo(stepOf(issues[0]), issues[0]);
      }
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      if (guided && mode === "add") clearDraft();
      toast(`Bot ${d.name} ${mode === "add" ? "added" : "updated"} successfully`);
    }, 900);
  };

  const start = (m: Mode) => {
    const fresh = seed(m, m === "edit" ? initialBot : undefined);
    setMode(m);
    setD(fresh);
    setOriginal(m === "edit" ? JSON.stringify(fresh) : "");
    setStep(0);
    setMaxStep(m === "edit" ? REVIEW : 0);
    setAttempted({});
    setTouched({});
    setAdv(false);
    setSkillDraft(null);
    setAgentsLoading(false);
    agentsLoaded.current = m === "edit";
    setDone(false);
    setSubmitting(false);
    setPhase(guided && m === "add" ? "intro" : "wizard");
    setNote(null);
    setNoteOpen(true);
    setTourOn(false);
  };

  const TOUR_KEY = "bw-tour-seen";
  const closeTour = useCallback(() => {
    setTourOn(false);
    try { localStorage.setItem(TOUR_KEY, "1"); } catch { /* storage unavailable */ }
  }, []);

  const beginFrom = (t: BotTemplate | null) => {
    if (t) setD((prev) => applyTemplate(prev, t));
    setNote(t ? { title: "Started from the " + t.title + " template.", text: "We pre-filled the routing, agent or skills and the handover hours. Review each step and adjust anything that doesn’t match this client’s needs." } : null);
    setNoteOpen(true);
    setPhase("wizard");
    window.scrollTo({ top: 0 });
    let seen = false;
    try { seen = localStorage.getItem(TOUR_KEY) === "1"; } catch { /* treat as unseen */ }
    if (!seen) setTimeout(() => setTourOn(true), 400);
  };

  const changes = useMemo(() => (original ? diffBot(JSON.parse(original) as BotForm, d) : []), [original, d]);

  // Auto-save a draft of a new bot as the user works, so they can pick it up again from the Bots list.
  useEffect(() => {
    if (!guided || mode !== "add" || phase !== "wizard" || done || !worthSaving(d, step)) return;
    const t = setTimeout(() => {
      saveDraft({ d, step, maxStep, note, client: CLIENT_NAME, savedAt: Date.now() });
      setSavedFlash(true);
    }, 700);
    return () => clearTimeout(t);
  }, [guided, mode, phase, done, d, step, maxStep, note, CLIENT_NAME]);
  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(false), 2200);
    return () => clearTimeout(t);
  }, [savedFlash]);

  const ctx: WizardCtx = {
    d, mode, step, maxStep, errors, err, touch, set, update, skillDraft, setSkillDraft,
    adv, setAdv, agentsLoading, go, toast, stepErrors, issueKeys, stepStatus, changes,
  };

  const add = mode === "add";
  const dirty = !add && original !== JSON.stringify(d);
  const leave = () => {
    setModal(false);
    if (guided && add) clearDraft();
    if (onExit) onExit();
    else { start(mode); toast("Closed. In the app this returns to the Bots table."); }
  };
  // Only ask before closing when there is something to lose.
  const requestClose = () => ((add ? worthSaving(d, step) : dirty) ? setModal(true) : leave());
  const head = stepMeta(step, d.routing);
  const StepView = STEP_VIEWS[step];
  const left = step < REVIEW ? stepErrors(step).length : 0;
  const showMissing = () => {
    setAttempted((a) => ({ ...a, [step]: true }));
    if (stepErrors(step).some((k) => ADV.includes(k))) setAdv(true);
    focusFirstError();
  };
  const headline = step === REVIEW ? "Review & save" : head.h;

  return (
    <Wizard.Provider value={ctx}>
      <div className={`shell${phase === "intro" && view === "proto" ? " wide" : ""}`}>
        <div className="pbar">
          <b>Prototype controls</b>
          {onExit && <button type="button" className="link" onClick={onExit}>&larr; Back to Bots list</button>}
          <span>
            Flow:{" "}
            <span className="seg">
              <button type="button" aria-pressed={add} onClick={() => start("add")}>Add new bot</button>
              <button type="button" aria-pressed={!add} onClick={() => start("edit")}>Edit existing bot</button>
            </span>
          </span>
          <span>
            View:{" "}
            <span className="seg">
              <button type="button" aria-pressed={view === "proto"} onClick={() => setView("proto")}>Prototype</button>
              <button type="button" aria-pressed={view === "plan"} onClick={() => setView("plan")}>Structure plan</button>
            </span>
          </span>
        </div>

        {view === "plan" ? (
          <PlanView />
        ) : phase === "intro" ? (
          <Welcome onStart={beginFrom} onCancel={() => onExit?.()} />
        ) : (
          <>
            <div className="builder">
              {!done && <Rail onBack={requestClose} />}
              <div className="rcol" style={done ? { gridColumn: "1 / -1" } : undefined}>
                <div className="top">
                  <span className="top-ic"><Bot size={16} /></span>
                  <div className="top-tx">
                    <h1>{add ? "Add a new bot" : `Edit ${d.name || "bot"}`}</h1>
                    <p className="top-sub">{add ? "Set up a bot for your client in a few guided steps." : "Update this bot’s configuration. The client can’t be changed."}</p>
                  </div>
                  <span className="pill">Client: <b>{CLIENT_NAME}</b>{add ? "" : " · locked"}</span>
                  {dirty && <span className="pill"><span className="dot" />Unsaved changes</span>}
                  {savedFlash && <span className="pill saved"><Check size={12} strokeWidth={3} /> Draft saved</span>}
                  {guided && add && <button type="button" className="link" onClick={() => setTourOn(true)}>Take a quick tour</button>}
                  <button type="button" className="xbtn" aria-label="Close bot setup" data-tip="Close" data-tip-pos="bottom" onClick={requestClose}><IconX size={16} w={2.2} /></button>
                </div>

                <section className="card main" ref={mainRef} aria-live="polite">
                  {done ? (
                    <div className="success">
                      <div className="big"><IconCheck size={30} /></div>
                      <h2 style={{ fontSize: 19, fontWeight: 500 }}>Bot {d.name} {add ? "added" : "updated"} successfully</h2>
                      <p className="muted" style={{ maxWidth: "44ch" }}>In the real app this returns to the Bots table and shows a success snackbar.</p>
                      <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={() => (onExit ? onExit() : start(mode))}>{onExit ? "Back to Bots list" : "Back to prototype"}</button>
                    </div>
                  ) : (
                    <>
                      {add && note && noteOpen && (
                        <div className="tpl-note" role="note">
                          <b>{note.title}</b>
                          <span>{note.text}</span>
                          <button type="button" className="x" aria-label="Dismiss" data-tip="Dismiss" onClick={() => setNoteOpen(false)}><IconX size={12} /></button>
                        </div>
                      )}
                      <div className="step-head">
                        <span className="step-ic">{STEP_ICONS[step]}</span>
                        <div>
                          <div className="eyebrow">Step {step + 1} of {STEPS.length} &middot; {head.t}</div>
                          <h2>{headline}</h2>
                          <p>{head.s}</p>
                        </div>
                      </div>
                      <div className="body"><StepView /></div>
                      <div className="foot">
                        <button type="button" className="btn" onClick={() => (step > 0 ? go(step - 1) : requestClose())}>
                          {step > 0 ? <><ChevronLeft size={14} /> Previous</> : "Cancel"}
                        </button>
                        <span className="sp">
                          {step < REVIEW && (left > 0 ? (
                            <button type="button" className="leftbtn" onClick={showMissing}>
                              <AlertCircle size={14} /> {left} item{left > 1 ? "s" : ""} left to complete
                            </button>
                          ) : (
                            <span className="leftok"><Check size={14} strokeWidth={3} /> This step is complete</span>
                          ))}
                        </span>
                        {step === REVIEW ? (
                          <button type="button" className="btn primary" disabled={submitting || (!add && !dirty)} title={!add && !dirty ? "Nothing has changed yet" : undefined} onClick={submit}>
                            {submitting ? <><span className="spin" />{add ? "Adding…" : "Saving…"}</> : <><Check size={15} />{add ? "Add bot" : "Update bot"}</>}
                          </button>
                        ) : (
                          <>
                            {/* Editing: every step is reachable, so changing one field shouldn't mean walking through the rest. */}
                            {!add && (
                              <button type="button" className="btn primary" disabled={submitting || !dirty} title={!dirty ? "Nothing has changed yet" : undefined} onClick={submit}>
                                {submitting ? <><span className="spin" />Saving…</> : <><Check size={15} />Save changes</>}
                              </button>
                            )}
                            <button type="button" className={`btn${add ? " primary" : ""}`} onClick={next}>Next <ArrowRight size={15} /></button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <ConfirmDialog title="Discard this bot?" confirmLabel="Discard" cancelLabel="Keep editing" danger onConfirm={leave} onCancel={() => setModal(false)}>
          Are you sure you want to close? Any unsaved data will be lost.
        </ConfirmDialog>
      )}
      {tourOn && phase === "wizard" && <Tour steps={WIZARD_TOUR} label="Bot setup tour" onClose={closeTour} />}
      <div className={`toast${toastOn ? " show" : ""}`} role="status">{toastMsg}</div>
    </Wizard.Provider>
  );
}
