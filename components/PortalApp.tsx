"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { FilePen } from "lucide-react";
import { CLIENTS, type BotRow } from "@/lib/bots";
import { STEPS, stepMeta } from "@/lib/constants";
import { clearDraft, loadDraft, timeAgo, type Draft } from "@/lib/draft";
import { APP_TOUR } from "@/lib/tours";
import ConfirmDialog from "./Modal";
import BotDetail from "./detail/BotDetail";
import Tour from "./guide/Tour";
import BotsList, { type ListState } from "./list/BotsList";
import PortalShell from "./shell/PortalShell";

// The wizard generates a random Bot ID, so render it on the client only to avoid hydration mismatches.
const BotWizard = dynamic(() => import("./BotWizard"), { ssr: false, loading: () => null });

interface DupAsk { bot: BotRow; client: string; from: "list" | "detail" }
interface ToastAction { label: string; run: () => void; done: string }

type Screen =
  | { name: "list" }
  | { name: "detail"; client: string; bot: BotRow }
  | { name: "wizard"; mode: "add" | "edit"; client: string; bot?: BotRow; step?: number; dup?: BotRow; resume?: Draft; from: "list" | "detail" };

export default function PortalApp() {
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [listState, setListState] = useState<ListState>("data");
  const [removed, setRemoved] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<BotRow | null>(null);
  const [dupAsk, setDupAskState] = useState<DupAsk | null>(null);
  const [dupClient, setDupClient] = useState("");
  // Always start the picker empty so the client is a deliberate choice.
  const setDupAsk = (v: DupAsk | null) => { setDupClient(""); setDupAskState(v); };
  const [dark, setDark] = useState(false);
  const [appTour, setAppTour] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [toastAct, setToastAct] = useState<ToastAction | null>(null);
  const firstScreen = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("portal-theme");
      setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("portal-theme", dark ? "dark" : "light"); } catch { /* ignore */ }
  }, [dark]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const toast = useCallback((msg: string, action?: ToastAction) => {
    setToastMsg(msg);
    setToastAct(action ?? null);
    setToastOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), action ? 7000 : 2400);
  }, []);

  const go = useCallback((s: Screen) => {
    window.scrollTo({ top: 0 });
    setScreen(s);
  }, []);
  // Pick up any auto-saved draft whenever the list is on screen.
  useEffect(() => {
    if (screen.name === "list") setDraft(loadDraft());
  }, [screen.name]);

  // Tell screen-reader users the view changed: update the page title and move focus to the main region.
  useEffect(() => {
    const name = screen.name === "detail" ? screen.bot.name : screen.name === "wizard" ? (screen.mode === "add" ? "Add a new bot" : `Edit ${screen.bot?.name ?? "bot"}`) : "Bots";
    document.title = `${name} · Management Portal`;
    if (firstScreen.current) { firstScreen.current = false; return; }
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [screen]);

  const backToList = useCallback(() => go({ name: "list" }), [go]);

  const navigate = (label: string) => {
    if (label === "Bots") backToList();
    else toast(`Prototype: only EngageAI › Bots is wired up (“${label}”)`);
  };

  // The tour walks the Bots list, so go there first if the user is somewhere else.
  const startTour = () => {
    if (screen.name !== "list") {
      backToList();
      setTimeout(() => setAppTour(true), 150);
    } else setAppTour(true);
  };

  const remove = (bot: BotRow) => {
    setRemoved((r) => [...r, bot.botId]);
    setConfirm(null);
    toast(`Bot ${bot.name} deleted`, { label: "Undo", done: `Bot ${bot.name} restored`, run: () => setRemoved((r) => r.filter((id) => id !== bot.botId)) });
    if (screen.name === "detail") backToList();
  };

  return (
    <PortalShell dark={dark} onToggleTheme={() => setDark((d) => !d)} onNavigate={navigate} onTour={startTour} activeLabel="Bots">
      {/* The list stays mounted (just hidden) so search, filters, view and page survive a trip to a bot. */}
      <div hidden={screen.name !== "list"}>
        <div className="content pc-wrap">
          <div className="pbar">
            <b>Prototype controls</b>
            <span>
              List data:{" "}
              <span className="seg">
                {(["data", "loading", "empty"] as ListState[]).map((s) => (
                  <button key={s} type="button" aria-pressed={listState === s} onClick={() => setListState(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
                ))}
              </span>
            </span>
          </div>
          {draft && (
            <div className="draft-bar" role="status">
              <span className="di"><FilePen size={18} /></span>
              <div className="dt">
                <b>Continue your draft</b>
                <span>{draft.d.name.trim() || "Untitled bot"} · {stepMeta(draft.step, draft.d.routing).t} (step {draft.step + 1} of {STEPS.length}) · saved {timeAgo(draft.savedAt)}</span>
              </div>
              <button type="button" className="btn sm primary" onClick={() => go({ name: "wizard", mode: "add", client: draft.client, from: "list", resume: draft })}>Continue</button>
              <button type="button" className="btn sm" onClick={() => { clearDraft(); setDraft(null); toast("Draft discarded"); }}>Discard</button>
            </div>
          )}
        </div>
        <BotsList
          state={listState}
          toast={toast}
          removed={removed}
          onRemove={remove}
          onAdd={(client) => go({ name: "wizard", mode: "add", client, from: "list" })}
          onEdit={(bot, client) => go({ name: "wizard", mode: "edit", client, bot, from: "list" })}
          onDuplicate={(bot, client) => setDupAsk({ bot, client, from: "list" })}
          onOpen={(bot, client) => go({ name: "detail", client, bot })}
        />
      </div>

      {screen.name === "detail" && (
        <BotDetail
          key={screen.bot.botId}
          bot={screen.bot}
          client={screen.client}
          toast={toast}
          onBack={backToList}
          onEdit={(step) => go({ name: "wizard", mode: "edit", client: screen.client, bot: screen.bot, step, from: "detail" })}
          onDelete={() => setConfirm(screen.bot)}
          onDuplicate={() => setDupAsk({ bot: screen.bot, client: screen.client, from: "detail" })}
        />
      )}

      {screen.name === "wizard" && (
        <div className="content">
          <BotWizard
            key={`${screen.mode}-${screen.bot?.botId ?? "new"}-${screen.step ?? 0}-${screen.dup?.botId ?? ""}-${screen.resume ? "draft" : ""}`}
            initialMode={screen.mode}
            initialStep={screen.step}
            guided
            initialBot={screen.bot}
            duplicateOf={screen.dup}
            resume={screen.resume}
            clientName={screen.client}
            onExit={() => { const back = screen.dup ?? screen.bot; return screen.from === "detail" && back ? go({ name: "detail", client: screen.client, bot: back }) : backToList(); }}
          />
        </div>
      )}

      {dupAsk && (
        <ConfirmDialog
          title="Duplicate bot"
          confirmLabel="Continue"
          confirmDisabled={!dupClient}
          onConfirm={() => {
            const client = CLIENTS.find((c) => c.id === dupClient);
            if (!client) return;
            go({ name: "wizard", mode: "add", client: client.name, dup: dupAsk.bot, from: dupAsk.from });
            setDupAsk(null);
          }}
          onCancel={() => setDupAsk(null)}
        >
          <span style={{ display: "block", padding: "8px 12px", borderRadius: 8, background: "var(--info-soft)" }}>
            Duplicating <b style={{ color: "var(--fg)" }}>{dupAsk.bot.name}</b>
            <br />Currently belongs to: <b style={{ color: "var(--fg)" }}>{dupAsk.client}</b>
          </span>
          <span style={{ display: "block", marginTop: 12 }}>Choose the client the copy will belong to.</span>
          <span className="sel" style={{ display: "block", marginTop: 12 }}>
            <select className="inp" aria-label="Client" value={dupClient} onChange={(e) => setDupClient(e.target.value)}>
              <option value="">Select a client</option>
              {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </span>
        </ConfirmDialog>
      )}
      {confirm && (
        <ConfirmDialog title="Delete Bot" confirmLabel="Delete" danger onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)}>
          Are you sure you want to delete bot <b style={{ color: "var(--fg)" }}>{confirm.name}</b>? You can undo this right after.
        </ConfirmDialog>
      )}
      <div className={`toast${toastOn ? " show" : ""}`} role="status">
        {toastMsg}
        {toastAct && toastOn && (
          <button type="button" className="toast-act" onClick={() => { const t = toastAct; t.run(); toast(t.done); }}>{toastAct.label}</button>
        )}
      </div>
      {appTour && <Tour steps={APP_TOUR} label="Application tour" onClose={() => setAppTour(false)} />}
    </PortalShell>
  );
}
