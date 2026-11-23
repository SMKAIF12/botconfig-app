"use client";
import { LANGS } from "@/lib/constants";
import { expirySeconds } from "@/lib/helpers";
import type { ExpiryUnit } from "@/lib/types";
import { useWiz } from "../ctx";
import { Choice, Field, IconX, NumInput, Section, Toggle } from "../ui";

const PRESETS: [number, ExpiryUnit, string][] = [
  [30, "min", "30 min"],
  [1, "hour", "1 hour"],
  [4, "hour", "4 hours"],
  [24, "hour", "24 hours"],
];

export default function StepChat() {
  const { d, set, touch, update } = useWiz();
  const available = LANGS.filter(([, code]) => !d.languages.some((l) => l.code === code));
  const secs = expirySeconds(d);
  const unitOptions: [ExpiryUnit, string][] = [["min", "Minutes"], ["hour", "Hours"], ["day", "Days"]];
  if (d.expiryUnit === "sec") unitOptions.push(["sec", "Seconds"]);

  const addLanguage = (code: string) => {
    const lang = LANGS.find((l) => l[1] === code);
    if (!lang) return;
    update((x) => {
      x.languages.push({ name: lang[0], code: lang[1] });
      if (x.languages.length === 1) x.defaultLanguage = lang[1];
    });
    touch("languages");
  };

  return (
    <>
      <Section title="Languages">
        <Field label="Languages" htmlFor="f-languages" errKey="languages" req group hint={{ text: "Customers can chat in any language you add for this client. The default language is used when we can’t tell which one they speak." }}>
          <div className="chips lang-grid" role="list" aria-labelledby="f-languages-l">
            {d.languages.length === 0 && <span className="help">No languages yet.</span>}
            {d.languages.map((l) => {
              const isDef = l.code === d.defaultLanguage;
              return (
                <span key={l.code} role="listitem" className={`chip${isDef ? " def" : ""}`}>
                  <span>{l.name} <span className="muted">({l.code})</span></span>
                  {isDef
                    ? <span className="tag">Default</span>
                    : <button className="link" type="button" onClick={() => set("defaultLanguage", l.code)}>Make default</button>}
                  <button type="button" className="x" aria-label={`Remove ${l.name}`} data-tip="Remove language" disabled={isDef}
                    onClick={() => { update((x) => { x.languages = x.languages.filter((y) => y.code !== l.code); }); touch("languages"); }}>
                    <IconX />
                  </button>
                </span>
              );
            })}
          </div>
        </Field>
        <div className="field">
          <label className="lbl" htmlFor="lang-add">Add a language</label>
          <div className="sel lang-add">
            <select className="inp" id="lang-add" value="" onChange={(e) => addLanguage(e.target.value)}>
              <option value="" disabled>{available.length ? "Select a language" : "All languages added"}</option>
              {available.map(([name, code]) => <option key={code} value={code}>{name} ({code})</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="How chats work">
        <Field label="Who answers first?" htmlFor="f-routing" errKey="routing" req group tech="Routing strategy" hint={{ text: "Bot: replies from the skills and intents you set up. AI Agent: an AI handles the whole conversation. Not sure? Choose AI Agent and pick one in step 3." }}>
          <div className="choices" role="radiogroup" aria-labelledby="f-routing-l">
            <Choice checked={d.routing === "BOT"} onSelect={() => set("routing", "BOT")} title="Bot" sub="Replies using the skills and intents you set up." />
            <Choice checked={d.routing === "AI-AGENT"} onSelect={() => set("routing", "AI-AGENT")} title="AI Agent" sub="An AI agent handles the conversation." />
          </div>
        </Field>

        <Field label="End idle chats after" htmlFor="f-expiry" errKey="expiry" req tech="Expires in (seconds)"
          help={`Saved as ${isNaN(secs) ? "—" : secs.toLocaleString()} seconds.`}>
          <div className="inline">
            <div className="num"><NumInput path="expiryValue" id="f-expiry" touchKey="expiry" /></div>
            <div className="sel">
              <select className="inp" aria-label="Time unit" value={d.expiryUnit} onChange={(e) => set("expiryUnit", e.target.value)}>
                {unitOptions.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="chips presets">
            {PRESETS.map(([value, unit, label]) => (
              <button key={label} type="button" className="preset" aria-pressed={d.expiryValue === value && d.expiryUnit === unit}
                onClick={() => update((x) => { x.expiryValue = value; x.expiryUnit = unit; })}>
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Toggle path="feedback" title="Ask customers for feedback on replies" help="Lets the client’s customers rate the bot’s replies, so the client can see how it is doing." />
      </Section>
    </>
  );
}
