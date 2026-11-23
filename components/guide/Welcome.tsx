"use client";
import {
  ArrowLeft, ArrowRight, Bot, BrainCircuit, Check, ClipboardCheck, Clock, CreditCard, FilePlus2, Globe, Headset, Languages, LifeBuoy, MessageSquare,
  ShoppingBag, Sparkles, Stethoscope, TrendingUp, UserRound,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { STEPS } from "@/lib/constants";
import { TEMPLATES, type BotTemplate } from "@/lib/templates";
import { Avatar } from "../ui";

interface Props {
  onStart: (template: BotTemplate | null) => void;
  onCancel: () => void;
}

const NEEDS: [ReactNode, string, string][] = [
  [<UserRound key="a" size={20} />, "Name and picture", "Bot name, picture and type, plus the client’s industry and timezone"],
  [<Globe key="b" size={20} />, "Languages", "The languages the client’s customers speak, and the default one"],
  [<Headset key="c" size={20} />, "Live agent hours", "When the client’s team can take over from the bot, and for how long"],
  [<CreditCard key="e" size={20} />, "Subscription & storage", "Your Chargebee subscription ID for tracking the client’s plan, and where files are stored"],
];

// Icon and tint (hue) for each template card.
const TPL_LOOK: Record<string, { icon: ReactNode; hue: number }> = {
  support: { icon: <LifeBuoy size={22} />, hue: 12 },
  sales: { icon: <TrendingUp size={22} />, hue: 150 },
  ordering: { icon: <ShoppingBag size={22} />, hue: 40 },
  clinic: { icon: <Stethoscope size={22} />, hue: 200 },
};
// includes[] lines are matched to an icon by their wording
const incIcon = (text: string) =>
  /^Routing/.test(text) ? <MessageSquare size={14} /> : /agent$/.test(text) ? <Bot size={14} /> : /skill/.test(text) ? <Sparkles size={14} /> : <Clock size={14} />;

// One icon per wizard step, in the same order as STEPS.
const STEP_ICONS: ReactNode[] = [
  <UserRound key="1" size={18} />, <Languages key="2" size={18} />, <BrainCircuit key="3" size={18} />,
  <Headset key="4" size={18} />, <CreditCard key="5" size={18} />, <ClipboardCheck key="6" size={18} />,
];

export default function Welcome({ onStart, onCancel }: Props) {
  return (
    <div className="welcome">
      <button type="button" className="link back" onClick={onCancel}><ArrowLeft size={14} /> Back to Bots</button>

      <div className="w-hero2">
        <div className="w-hero-text">
          <h1>Set up a bot for your client</h1>
          <p>Configure the bot your client needs through a short, guided sequence. Each setting is checked as you go, and once saved, you can review or update the configuration at any time from the Bots list.</p>
          <div className="w-meta">
            <span><Clock size={14} /> About 5 minutes</span>
            <span><ClipboardCheck size={14} /> {STEPS.length} short steps</span>
            <span><Check size={14} strokeWidth={3} /> Review before saving</span>
          </div>
        </div>
        <div className="w-art" aria-hidden="true">
          <span className="b1"><Avatar i={5} /></span>
          <span className="b2"><Avatar i={2} /></span>
          <span className="b3"><Avatar i={7} /></span>
        </div>
      </div>

      <section>
        <h3 className="w-h">Have these ready</h3>
        <div className="w-tiles">
          {NEEDS.map(([icon, t, s]) => (
            <div key={t} className="w-tile">
              <span className="w-ti">{icon}</span>
              <b>{t}</b>
              <small>{s}</small>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="w-h">How it works</h3>
        <ol className="w-line" style={{ "--n": STEPS.length } as CSSProperties}>
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <span className="w-node">{STEP_ICONS[i]}<i>{i + 1}</i></span>
              <span className="w-txt"><b>{s.t}</b><small>{s.d}</small></span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="w-h-row">
          <h3 className="w-h">Choose a starting point</h3>
          <p className="muted">Templates pre-fill typical settings (agent, skills and live agent hours) for common client needs. You still name the bot and review every step before saving.</p>
        </div>
        <div className="tpls">
          {TEMPLATES.map((t) => {
            const look = TPL_LOOK[t.id];
            return (
              <button key={t.id} type="button" className="tpl" style={{ "--th": look.hue } as CSSProperties} onClick={() => onStart(t)}>
                <span className="tpl-head">
                  <span className="tpl-ic">{look.icon}</span>
                  {t.id === "support" && <span className="rec hot">Most popular</span>}
                </span>
                <b className="tpl-title">{t.title}</b>
                <span className="tpl-desc">{t.desc}</span>
                <ul className="tpl-inc">
                  {t.includes.map((x) => <li key={x}>{incIcon(x)}{x}</li>)}
                </ul>
                <span className="tpl-cta">Use this template <ArrowRight size={14} /></span>
              </button>
            );
          })}
          <button type="button" className="tpl scratch" onClick={() => onStart(null)}>
            <span className="tpl-head"><span className="tpl-ic plain"><FilePlus2 size={22} /></span></span>
            <b className="tpl-title">Start from scratch</b>
            <span className="tpl-desc">Fill in every setting yourself. Best if the client’s bot doesn’t match a template.</span>
            <ul className="tpl-inc"><li>Full control over every step</li><li>Nothing pre-filled</li></ul>
            <span className="tpl-cta">Start blank <ArrowRight size={14} /></span>
          </button>
        </div>
      </section>
    </div>
  );
}
