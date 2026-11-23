"use client";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy, Globe, MessageSquare, PenLine, Sparkles, Trash2 } from "lucide-react";
import { ROUTING_LABEL, fmtDate, type BotRow } from "@/lib/bots";
import { COUNTRIES } from "@/lib/constants";
import { agentById, expiryText, fmt12, hoursSummary, storageById, tzLabel, typeLabel } from "@/lib/helpers";
import { botFromRow } from "@/lib/sample";
import { Avatar } from "../ui";

interface Props {
  bot: BotRow;
  client: string;
  onBack: () => void;
  /** step = wizard step to jump to (0–4); undefined opens at the first step. */
  onEdit: (step?: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  toast: (msg: string) => void;
}

type DetailTab = "overview" | "configuration" | "settings";
const TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "configuration", label: "Configuration" },
  { id: "settings", label: "Settings" },
];

function Card({ title, sub, step, onEdit, children }: { title: string; sub?: string; step: number; onEdit: (s: number) => void; children: ReactNode }) {
  return (
    <section className="dcard" aria-label={title}>
      <header>
        <div><b>{title}</b>{sub && <span>{sub}</span>}</div>
        <button type="button" className="link" onClick={() => onEdit(step)}>Edit</button>
      </header>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="drows">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd>{v === "" || v == null ? <span className="muted">Not set</span> : v}</dd>
        </div>
      ))}
    </dl>
  );
}

const On = ({ on }: { on: boolean }) => <span className={`flag ${on ? "on" : "off"}`}>{on ? "On" : "Off"}</span>;

export default function BotDetail({ bot, client, onBack, onEdit, onDelete, onDuplicate, toast }: Props) {
  const d = useMemo(() => botFromRow(bot), [bot]);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<DetailTab>("overview");
  const agent = agentById(d.agentId);
  const storage = storageById(d.storageId);

  const copy = async () => {
    try { await navigator.clipboard.writeText(bot.botId); } catch { /* clipboard unavailable */ }
    setCopied(true);
    toast("Bot ID copied");
    setTimeout(() => setCopied(false), 1600);
  };

  const basics = (
    <Card title="Basics" sub="Identity and purpose" step={0} onEdit={onEdit}>
      <Rows rows={[
        ["Name", d.name], ["Type", typeLabel(d.botType)], ["Industry", d.industry],
        ["Timezone", tzLabel(d.timezone)], ["Default country", COUNTRIES.find(([c]) => c === d.defaultCountryCode)?.[1] ?? ""],
        ["Bot ID", <code key="id" className="mono">{d.botId}</code>],
      ]} />
    </Card>
  );

  const plan = (
    <Card title="Plan & storage" sub="Subscription and data" step={4} onEdit={onEdit}>
      <Rows rows={[
        ["Subscription", <code key="s" className="mono">{d.chargebeeId}</code>],
        ["Storage", storage?.name ?? ""],
        ["CX base URL", d.cxBaseUrl],
        ["Legacy bot", d.legacyId || d.legacyName ? `${d.legacyName} (${d.legacyId})` : "None"],
      ]} />
    </Card>
  );

  const answers = bot.routing === "BOT" ? (
    <Card title="Skills" sub="What the bot can handle" step={2} onEdit={onEdit}>
      {d.skills.length === 0 ? (
        <div className="empty dempty">No skills added yet</div>
      ) : (
        <ul className="skl">
          {d.skills.map((s) => (
            <li key={s.name}><b>{s.name}</b><span className="mono">{s.intent}</span><On on={s.enabled} /></li>
          ))}
        </ul>
      )}
    </Card>
  ) : (
    <Card title="AI agent" sub="What powers the bot" step={2} onEdit={onEdit}>
      <Rows rows={[["Agent", agent ? <span key="a"><b style={{ fontWeight: 500 }}>{agent.name}</b></span> : "None selected"]]} />
      {agent && <p className="help dhelp">{agent.desc}</p>}
    </Card>
  );

  const chat = (
    <Card title="Languages & chat" sub="How it talks to customers" step={1} onEdit={onEdit}>
      <div className="chips dchips">
        {d.languages.map((l) => (
          <span key={l.code} className={`chip${l.code === d.defaultLanguage ? " def" : ""}`}>
            {l.name}{l.code === d.defaultLanguage && <span className="tag">Default</span>}
          </span>
        ))}
      </div>
      <Rows rows={[
        ["Answers first", ROUTING_LABEL[d.routing]],
        ["Idle chats end after", expiryText(d)],
        ["Feedback on replies", <On key="f" on={d.feedback} />],
      ]} />
    </Card>
  );

  const live = (
    <Card title="Live agent" sub="When a human takes over" step={3} onEdit={onEdit}>
      <div className="week">
        {d.lh.hours.map((h) => (
          <div key={h.day} className={`wd${h.available ? "" : " off"}`}>
            <b>{h.day.slice(0, 3)}</b>
            {h.available ? <><span>{fmt12(h.start)}</span><span>{fmt12(h.end)}</span></> : <span>Off</span>}
          </div>
        ))}
      </div>
      <Rows rows={[
        ["Summary", hoursSummary(d.lh.hours)],
        ["Timezone", tzLabel(d.lh.timezone)],
        ["Waits up to", `${d.lh.waitMin} min`],
        ["Live chat length", `${d.lh.modeMin} min`],
        ["Join / leave messages", <span key="jl" className="flags"><On on={d.lh.joinMsg} /><On on={d.lh.leaveMsg} /></span>],
      ]} />
    </Card>
  );

  return (
    <div className="content">
      {/* Breadcrumb / back link */}
      <div className="dback">
        <button type="button" className="backlink" onClick={onBack}>
          <ArrowLeft size={14} /> All Bots <span className="muted-s">/ {bot.botId}</span>
        </button>
      </div>

      {/* Title card */}
      <div className="dhero">
        <span className="bav xl"><Avatar i={bot.avatar} /></span>
        <div className="dtitle">
          <div className="dline">
            <h1>{bot.name}</h1>
            <span className={`badge-s ${bot.routing === "AI-AGENT" ? "st-ai" : "st-bot"}`}>{ROUTING_LABEL[bot.routing]}</span>
          </div>
          <div className="dmeta">
            <span>{typeLabel(bot.botType)}</span>
            <span className="dot-sep" />
            <span>Client: <b>{client}</b></span>
            <span className="dot-sep" />
            <span>Created {fmtDate(bot.createdAt)}</span>
          </div>
        </div>
        <div className="dacts">
          <button type="button" className="btn" onClick={() => onEdit()}><PenLine size={14} /> Edit</button>
          <button type="button" className="btn" onClick={onDuplicate}><Copy size={14} /> Duplicate</button>
          <button type="button" className="btn" onClick={copy} title="Copy bot ID" aria-label={`Copy bot ID ${bot.botId}`}>
            {copied ? <Check size={14} className="ok-ic" /> : <Copy size={14} />} {copied ? "Copied" : "Copy ID"}
          </button>
        </div>
      </div>

      {/* Tabbed panel */}
      <div className="dpanel">
        <div className="dtabs" role="tablist" aria-label="Bot details">
          {TABS.map((item) => (
            <button key={item.id} type="button" role="tab" id={`bot-tab-${item.id}`} aria-selected={tab === item.id}
              aria-controls={`bot-panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)}
              onKeyDown={(e) => {
                const i = TABS.findIndex((t) => t.id === item.id);
                const n = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length
                  : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
                if (n === -1) return;
                e.preventDefault();
                setTab(TABS[n].id);
                document.getElementById(`bot-tab-${TABS[n].id}`)?.focus();
              }}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="dbody" role="tabpanel" id={`bot-panel-${tab}`} aria-labelledby={`bot-tab-${tab}`}>
          {tab === "overview" && (
            <>
              <div className="stats">
                <div className="stat"><span className="si"><Globe size={18} /></span><div><b>{d.languages.length}</b><span>Language{d.languages.length > 1 ? "s" : ""}</span></div></div>
                {bot.routing === "BOT" ? (
                  <div className="stat"><span className="si"><Sparkles size={18} /></span><div><b>{d.skills.length}</b><span>Skill{d.skills.length === 1 ? "" : "s"}</span></div></div>
                ) : (
                  <div className="stat"><span className="si"><Sparkles size={18} /></span><div><b className="stat-sm">{agent?.name ?? "None"}</b><span>AI agent</span></div></div>
                )}
                <div className="stat"><span className="si"><MessageSquare size={18} /></span><div><b>{ROUTING_LABEL[bot.routing]}</b><span>Answers first</span></div></div>
              </div>
              <div className="dgrid">{basics}{plan}</div>
            </>
          )}

          {tab === "configuration" && (
            <div className="dgrid">
              <div className="dcol">{chat}{answers}</div>
              <div className="dcol">{live}</div>
            </div>
          )}

          {tab === "settings" && (
            <div className="dsettings">
              <div>
                <h2 className="dh2">Bot Settings</h2>
                <p className="dsub">Administrative actions for this bot.</p>
              </div>
              <div className="danger-zone">
                <div className="dz-title"><AlertTriangle size={16} /> <span>Danger Zone</span></div>
                <p>Permanently remove this bot and its configuration for {client}. You can undo this right after.</p>
                <button type="button" className="btn danger-o" onClick={onDelete}><Trash2 size={14} /> Delete Bot</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
