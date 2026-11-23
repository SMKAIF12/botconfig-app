"use client";
import { useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { COUNTRIES, stepMeta } from "@/lib/constants";
import { agentById, expiryText, hoursSummary, storageById, tzLabel, typeLabel } from "@/lib/helpers";
import { stepOf } from "@/lib/validate";
import { useWiz } from "../ctx";
import { IconCheck, IconWarn } from "../ui";

function Card({ title, step, rows }: { title: string; step: number; rows: [string, ReactNode][] }) {
  const { go } = useWiz();
  return (
    <div className="rsum">
      <header><b>{title}</b><button type="button" className="link" onClick={() => go(step)}>Edit</button></header>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt>{k}</dt>
            <dd>{v === "" || v == null ? <span className="muted">Not set</span> : v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function StepReview() {
  const { d, mode, errors, issueKeys, go, changes } = useWiz();
  const keys = issueKeys();
  const agent = agentById(d.agentId);
  const storage = storageById(d.storageId);
  const yes = (b: boolean) => (b ? "On" : "Off");
  const [view, setView] = useState<"card" | "table">("card");

  const sections: { title: string; step: number; rows: [string, ReactNode][] }[] = [
    { title: "Basics", step: 0, rows: [
      ["Name", d.name], ["Type", typeLabel(d.botType)], ["Industry", d.industry], ["Timezone", tzLabel(d.timezone)],
      ["Default country", COUNTRIES.find(([c]) => c === d.defaultCountryCode)?.[1] ?? ""],
    ] },
    { title: "Languages & chat", step: 1, rows: [
      ["Languages", d.languages.map((l) => l.name + (l.code === d.defaultLanguage ? " (default)" : "")).join(", ")],
      ["Answers first", d.routing === "BOT" ? "Bot" : "AI Agent"],
      ["Idle chats end after", expiryText(d)],
      ["Feedback on replies", yes(d.feedback)],
    ] },
    d.routing === "BOT"
      ? { title: "Skills", step: 2, rows: [
          ["Skills", d.skills.length ? d.skills.map((s) => s.name + (s.enabled ? "" : " (off)")).join(", ") : "None added"],
        ] }
      : { title: "AI agent", step: 2, rows: [["Agent", agent?.name ?? "None selected"]] },
    { title: "Live agent", step: 3, rows: [
      ["Available", hoursSummary(d.lh.hours)],
      ["Timezone", tzLabel(d.lh.timezone)],
      ["Waits up to", `${d.lh.waitMin} min`],
      ["Live chat length", `${d.lh.modeMin} min`],
      ["Join / leave messages", `${d.lh.joinMsg ? "Join on" : "Join off"} · ${d.lh.leaveMsg ? "Leave on" : "Leave off"}`],
    ] },
    { title: "Plan, storage & advanced", step: 4, rows: [
      ["Subscription", d.chargebeeId],
      ["Storage", storage?.name ?? ""],
      ["CX base URL", d.cxBaseUrl],
      ["Legacy bot", d.legacyId || d.legacyName ? `${d.legacyName} (${d.legacyId})` : "None"],
      ["LG templates", d.lg.trim() ? "Added" : "None"],
    ] },
  ];

  return (
    <>
      {keys.length > 0 ? (
        <div className="banner bad">
          <IconWarn />
          <div>
            <b>{keys.length} thing{keys.length > 1 ? "s" : ""} need{keys.length > 1 ? "" : "s"} your attention</b>
            <ul>
              {keys.map((p) => (
                <li key={p}>
                  <button type="button" onClick={() => go(stepOf(p), p)}>{errors[p]}</button>{" "}
                  <span style={{ opacity: 0.7 }}>&middot; {stepMeta(stepOf(p), d.routing).t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="banner good">
          <IconCheck />
          <div>
            <b>Everything looks good</b>
            <span style={{ fontSize: 13 }}>{mode === "add" ? "The configuration is ready to save." : "Your changes are ready to save."}</span>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="rsum changes">
          <header><b>Changes to save</b><span className="cnt-pill">{changes.length}</span></header>
          {changes.length === 0 ? (
            <p className="chg-empty">Nothing has changed yet. Edit any step and the difference will be listed here before you save.</p>
          ) : (
            <ul className="chg">
              {changes.map((c, i) => (
                <li key={c.label + i}>
                  <span className="k">{c.label}</span>
                  <span className="from">{c.from}</span>
                  <ArrowRight size={14} />
                  <span className="to">{c.to}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rview">
        <span className="muted">View</span>
        <div className="seg" role="group" aria-label="Review layout">
          <button type="button" aria-pressed={view === "card"} onClick={() => setView("card")}>Cards</button>
          <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
        </div>
      </div>

      {view === "card" ? (
        sections.map((s) => <Card key={s.title} {...s} />)
      ) : (
        <div className="rsum rtable">
          <table>
            <thead>
              <tr><th>Section</th><th>Setting</th><th>Value</th><th aria-label="Edit" /></tr>
            </thead>
            <tbody>
              {sections.map((s) =>
                s.rows.map(([k, v], i) => (
                  <tr key={s.title + k} className={i === 0 ? "first" : undefined}>
                    {i === 0 && <th scope="rowgroup" rowSpan={s.rows.length}>{s.title}</th>}
                    <td className="k">{k}</td>
                    <td>{v === "" || v == null ? <span className="muted">Not set</span> : v}</td>
                    {i === 0 && (
                      <td rowSpan={s.rows.length} className="act">
                        <button type="button" className="link" onClick={() => go(s.step)}>Edit</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
