"use client";
import { Bot, ChevronLeft, ClipboardCheck, Clock, CreditCard, Headset, Languages, Sparkles, Check, GitBranch } from "lucide-react";
import type { ReactNode } from "react";
import { STEPS, rulesFor, stepMeta } from "@/lib/constants";
import { typeLabel } from "@/lib/helpers";
import { groupOk } from "@/lib/validate";
import { useWiz } from "./ctx";
import { Avatar } from "./ui";

/** One icon per wizard step, shown in the step marker (like the Skills configuration sidebar). */
export const STEP_ICONS: ReactNode[] = [
  <Bot key="b" size={15} />, <Languages key="l" size={15} />, <Sparkles key="s" size={15} />,
  <Headset key="h" size={15} />, <CreditCard key="p" size={15} />, <ClipboardCheck key="r" size={15} />,
];

export default function Rail({ onBack }: { onBack: () => void }) {
  const { d, step, maxStep, mode, go, stepStatus, errors } = useWiz();
  const rules = rulesFor(d.routing);
  const ready = rules.filter(([, pats]) => groupOk(pats, errors)).length;
  const pct = Math.round((ready / rules.length) * 100);
  const add = mode === "add";
  const picIndex = d.picture ? parseInt(d.picture.split("-")[1], 10) - 1 : -1;

  return (
    <nav className="rail" aria-label="Bot setup steps">
      <div className="rail-head">
        <strong className="rail-title">{add ? "New Bot" : "Edit Bot"}</strong>
        <span className={`rail-badge ${add ? "is-draft" : "is-live"}`}>
          {add ? <Clock size={10} strokeWidth={2.4} /> : <Check size={10} strokeWidth={2.4} />}
          {add ? "Draft" : "Published"}
        </span>
      </div>

      <div className="rail-bot">
        {picIndex >= 0 ? <span className="bav"><Avatar i={picIndex} /></span> : <span className="rail-ph"><GitBranch size={14} /></span>}
        <div style={{ minWidth: 0 }}>
          <b>{d.name || "Untitled bot"}</b>
          <small>{d.botType ? typeLabel(d.botType) : "Type not chosen"}</small>
        </div>
      </div>

      <div className="rail-prog">
        <div className="rail-prog-row"><span>Step {step + 1} of {STEPS.length}</span><span>{ready}/{rules.length} ready</span></div>
        <div className="bar" role="progressbar" aria-label="Setup progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="rail-list">
        {STEPS.map((_, i) => {
          const s = stepMeta(i, d.routing);
          const status = stepStatus(i);
          const locked = add && i > maxStep;
          return (
            <button key={s.t} type="button" className={`rstep ${status}`} disabled={locked}
              aria-current={i === step ? "step" : undefined} onClick={() => go(i)}>
              <span className="num" aria-hidden="true">{status === "done" ? <Check size={14} /> : status === "error" ? "!" : STEP_ICONS[i]}</span>
              <span className="rtx"><span className="t">{s.t}</span><span className="d">{s.d}</span></span>
              <span className="rdot" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <button type="button" className="rail-back" onClick={onBack}>
        <ChevronLeft size={15} /> Back to Bots
      </button>
    </nav>
  );
}
