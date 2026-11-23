"use client";
import { TZ } from "@/lib/constants";
import { useWiz } from "../ctx";
import { Field, NumInput, Section, SelectInput, Toggle } from "../ui";

type Preset = "wk" | "all" | "24";

const PRESETS: [Preset, string][] = [
  ["wk", "Mon–Fri, 9–6"],
  ["all", "Every day, 9–6"],
  ["24", "24 / 7"],
];

export default function StepLive() {
  const { d, update, touch, err, toast } = useWiz();
  const hours = d.lh.hours;

  const isActive = (p: Preset) => {
    if (p === "wk") return hours.every((x, i) => (i < 5 ? x.available && x.start === "09:00" && x.end === "18:00" : !x.available));
    if (p === "all") return hours.every((x) => x.available && x.start === "09:00" && x.end === "18:00");
    return hours.every((x) => x.available && x.start === "00:00" && x.end === "23:59");
  };

  const apply = (p: Preset) => {
    update((x) => {
      x.lh.hours.forEach((h, i) => {
        h.available = p === "wk" ? i < 5 : true;
        h.start = p === "24" ? "00:00" : "09:00";
        h.end = p === "24" ? "23:59" : "18:00";
      });
    });
    touch("hours");
  };

  return (
    <>
      <Section title="When is the client’s team available?" sub="Outside these hours the client’s customers won’t be handed to a person.">
        <Field label="Team timezone" htmlFor="f-lh-timezone" errKey="lh.timezone" req help={d.lh.tzTouched ? undefined : "Pre-filled from the bot’s timezone."}>
          <SelectInput path="lh.timezone" id="f-lh-timezone" ph="Select timezone" options={TZ} />
        </Field>

        <Field label="Weekly schedule" htmlFor="f-hours" errKey="hours" req group hint={{ text: "Tick the days the client’s team is online and set their hours. Outside these times customers stay with the bot." }}>
          <div className="chips" style={{ marginBottom: 10 }}>
            <span className="help" style={{ margin: "0 4px 0 0" }}>Quick set:</span>
            {PRESETS.map(([p, label]) => (
              <button key={p} type="button" className="preset" aria-pressed={isActive(p)} onClick={() => apply(p)}>{label}</button>
            ))}
          </div>
          <div className="sched" role="group" aria-labelledby="f-hours-l">
            {hours.map((h, i) => (
              <div className={`day${h.available ? "" : " off"}`} key={h.day}>
                <input type="checkbox" aria-label={`${h.day} available`} checked={h.available}
                  onChange={(e) => update((x) => { x.lh.hours[i].available = e.target.checked; })} />
                <span className="dn">{h.day.slice(0, 3)}</span>
                <input className="inp" type="time" aria-label={`${h.day} start`} value={h.start} disabled={!h.available}
                  onChange={(e) => update((x) => { x.lh.hours[i].start = e.target.value; })} />
                <span className="to">to</span>
                <input className="inp" type="time" aria-label={`${h.day} end`} value={h.end} disabled={!h.available}
                  onChange={(e) => update((x) => { x.lh.hours[i].end = e.target.value; })} />
                {err(`hour.${i}`) && <div className="day-err err" role="alert">{err(`hour.${i}`)}</div>}
              </div>
            ))}
            <div>
              <button type="button" className="link" onClick={() => {
                const m = hours[0];
                update((x) => { x.lh.hours.forEach((h) => { if (h.available) { h.start = m.start; h.end = m.end; } }); });
                toast("Copied Monday’s hours");
              }}>Copy Monday&rsquo;s hours to all open days</button>
            </div>
          </div>
        </Field>
      </Section>

      <Section title="Handover timing">
        <div className="row2">
          <Field label="Waiting for an agent (minutes)" htmlFor="f-lh-waitMin" errKey="wait" req tech="Live Agent Waiting Timeout" help="How long a customer can wait for a live agent to join.">
            <NumInput path="lh.waitMin" id="f-lh-waitMin" touchKey="wait" ph="e.g., 2" />
          </Field>
          <Field label="Live chat length (minutes)" htmlFor="f-lh-modeMin" errKey="mode" req tech="Live Agent Mode Timeout" help="How long a live-agent chat can stay active.">
            <NumInput path="lh.modeMin" id="f-lh-modeMin" touchKey="mode" ph="e.g., 30" />
          </Field>
        </div>
      </Section>

      <Section title="Messages to the customer">
        <Toggle path="lh.joinMsg" title="Show a message when an agent joins" help="Enable or disable the message shown to the end user when a live agent has joined." />
        <Toggle path="lh.leaveMsg" title="Show a message when an agent leaves" help="Enable or disable the message shown to the end user when a live agent has left." />
      </Section>
    </>
  );
}
