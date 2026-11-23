"use client";
import ConfirmDialog from "../Modal";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpRight, Building2, Copy, ChevronLeft, ChevronRight, Globe, LayoutGrid, Languages as LanguagesIcon, Sparkles, Bot as BotIcon, ListFilter, PenLine, Plus, RefreshCw, Search, Table2, Trash2, X,
} from "lucide-react";
import { BOTS, CLIENTS, ROUTING_LABEL, fmtDate, type BotRow, type Routing } from "@/lib/bots";
import { langName, tzLabel, typeLabel } from "@/lib/helpers";
import { Avatar, avatarHue } from "../ui";
import type { CSSProperties } from "react";

type SortField = "name" | "botId" | "botType" | "industry" | "timezone" | "routing" | "createdAt";
type ViewMode = "table" | "card";
export type ListState = "data" | "loading" | "empty";

const COLS: { label: string; field: SortField | null }[] = [
  { label: "Bot", field: "name" },
  { label: "Type", field: "botType" },
  { label: "Industry", field: "industry" },
  { label: "Languages", field: null },
  { label: "Timezone", field: "timezone" },
  { label: "Routing", field: "routing" },
  { label: "Created At", field: "createdAt" },
  { label: "Actions", field: null },
];

/** "2 months ago" style text; the exact date is shown on hover and underneath. */
function ago(iso: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86400000));
  if (days < 1) return "Today";
  if (days < 30) return days === 1 ? "Yesterday" : days + " days ago";
  const m = Math.floor(days / 30);
  if (m < 12) return m + (m === 1 ? " month ago" : " months ago");
  const y = Math.floor(m / 12);
  return y + (y === 1 ? " year ago" : " years ago");
}

const SORT_OPTIONS: [SortField, string][] = [
  ["createdAt", "Created At"], ["name", "Name"], ["botType", "Type"], ["industry", "Industry"],
];

function Hi({ text, q }: { text: string; q: string }) {
  const s = q.trim();
  if (!s) return <>{text}</>;
  const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    <>
      {text.split(new RegExp(`(${esc})`, "ig")).map((p, i) =>
        p.toLowerCase() === s.toLowerCase() ? <mark key={i}>{p}</mark> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

const RouteBadge = ({ r }: { r: Routing }) => <span className={`badge-s ${r === "AI-AGENT" ? "st-ai" : "st-bot"}`}>{ROUTING_LABEL[r]}</span>;

interface Props {
  state: ListState;
  onAdd: (clientName: string) => void;
  onEdit: (bot: BotRow, clientName: string) => void;
  onOpen: (bot: BotRow, clientName: string) => void;
  onDuplicate: (bot: BotRow, clientName: string) => void;
  removed: string[];
  onRemove: (bot: BotRow) => void;
  toast: (msg: string) => void;
}

export default function BotsList({ state, onAdd, onEdit, onOpen, onDuplicate, removed, onRemove, toast }: Props) {
  const [clientId, setClientId] = useState(CLIENTS[0].id);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [routeF, setRouteF] = useState<Routing[]>([]);
  const [typeF, setTypeF] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [tablePer, setTablePer] = useState(10);
  const [cardPer, setCardPer] = useState(8); // multiples of 4 so every row is full; 2 rows fit the viewport

  const [target, setTarget] = useState<BotRow | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fetching, setFetching] = useState(true);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevPos = useRef<Map<string, { x: number; y: number }>>(new Map());

  const client = CLIENTS.find((c) => c.id === clientId)!;
  const all = useMemo(
    () => (state === "empty" ? [] : (BOTS[clientId] ?? []).filter((b) => !removed.includes(b.botId))),
    [clientId, state, removed],
  );
  const types = useMemo(() => Array.from(new Set(all.map((b) => b.botType))), [all]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = all.filter((b) => {
      if (routeF.length && !routeF.includes(b.routing)) return false;
      if (typeF.length && !typeF.includes(b.botType)) return false;
      if (!q) return true;
      return [b.name, b.botId, b.botType, b.industry, b.timezone, ROUTING_LABEL[b.routing]].some((v) => v.toLowerCase().includes(q));
    });
    if (sortField) {
      r = [...r].sort((a, b) => {
        const c = String(a[sortField]).localeCompare(String(b[sortField]), undefined, { sensitivity: "base" });
        return sortDir === "asc" ? c : -c;
      });
    }
    return r;
  }, [all, search, routeF, typeF, sortField, sortDir]);

  const perPage = view === "card" ? cardPer : tablePer;
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(page, pages - 1);
  const slice = rows.slice(safePage * perPage, safePage * perPage + perPage);
  const filterCount = (routeF.length ? 1 : 0) + (typeF.length ? 1 : 0);
  const loading = state === "loading" || refreshing || fetching;

  // Pretend to fetch the bots: show the loading state on first load and each time another client is picked.
  useEffect(() => {
    setFetching(true);
    const t = setTimeout(() => setFetching(false), 900);
    return () => clearTimeout(t);
  }, [clientId]);

  useEffect(() => {
    if (!filtersOpen) return;
    const away = (e: MouseEvent) => !filterRef.current?.contains(e.target as Node) && setFiltersOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setFiltersOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [filtersOpen]);

  const sortBy = (f: SortField) => {
    setPage(0);
    if (sortField !== f) { setSortField(f); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortField(null); setSortDir("asc"); }
  };
  const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clearAll = () => { setSearch(""); setRouteF([]); setTypeF([]); setPage(0); };
  const refresh = () => { setRefreshing(true); setTimeout(() => { setRefreshing(false); toast("Bots refreshed"); }, 700); };
  const confirmDelete = () => {
    if (!target) return;
    const gone = target;
    setTarget(null);
    setLeaving(gone.botId); // let the row fade out before it is removed
    setTimeout(() => { onRemove(gone); setLeaving(null); }, 280);
  };

  const Actions = ({ b }: { b: BotRow }) => (
    <div className="acts-row" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="ibtn dup" aria-label={`Duplicate ${b.name}`} data-tip="Duplicate" onClick={() => onDuplicate(b, client.name)}><Copy size={16} /></button>
      <button type="button" className="ibtn edit" aria-label={`Edit ${b.name}`} data-tip="Edit" onClick={() => onEdit(b, client.name)}><PenLine size={16} strokeWidth={2.2} /></button>
      <button type="button" className="ibtn del" aria-label={`Delete ${b.name}`} data-tip="Delete" onClick={() => setTarget(b)}><Trash2 size={16} /></button>
    </div>
  );

  // FLIP "deal" animation: when sorting, filtering or deleting changes the order, each card flies from its old spot
  // to its new one with a springy settle, a slight tilt in the direction of travel and a small wave-like stagger.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) { prevPos.current = new Map(); return; }
    const base = grid.getBoundingClientRect();
    const next = new Map<string, { x: number; y: number }>();
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let n = 0;
    grid.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const pos = { x: r.left - base.left, y: r.top - base.top };
      next.set(el.dataset.id!, pos);
      const before = prevPos.current.get(el.dataset.id!);
      if (!before || calm) return;
      const dx = before.x - pos.x, dy = before.y - pos.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const tilt = Math.max(-4, Math.min(4, dx * -0.012));
      el.animate(
        [
          { transform: "translate(" + dx + "px," + dy + "px) rotate(" + tilt + "deg) scale(.96)", opacity: 0.85 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 760, delay: Math.min(n++, 12) * 26, easing: "cubic-bezier(.2,1.12,.3,1)", fill: "backwards" },
      );
    });
    prevPos.current = next;
  });

  const animKey = [safePage, sortField, sortDir, perPage, routeF.join(), typeF.join(), clientId, view].join("|");
  const stagger = (i: number) => ({ animationDelay: Math.min(i, 12) * 28 + "ms" });

  const hasFilters = !!search.trim() || filterCount > 0;

  return (
    <div className="content">
      <div className="page-head">
        <span className="ph-ic"><BotIcon size={18} /></span>
        <div>
          <h1>Bots Management</h1>
          <p className="ph-sub">Create and manage the bots your clients’ customers chat with.</p>
        </div>
      </div>

      {/* toolbar — same controls as the portal's TableToolbar, plus the view switch */}
      <div className="toolbar">
        <div className="sel tb-client">
          <select className="inp" aria-label="Select client" value={clientId} onChange={(e) => { setClientId(e.target.value); setPage(0); clearAll(); }}>
            {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <label className="search">
          <Search size={16} />
          <input className="inp" placeholder="Search bots..." aria-label="Search bots" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          {search && <button type="button" className="clr" aria-label="Clear search" data-tip="Clear search" onClick={() => setSearch("")}><X size={14} /></button>}
        </label>

        <div className="fwrap" ref={filterRef}>
          <button type="button" className={`btn tbtn${filterCount ? " active" : ""}`} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
            <ListFilter size={16} /> Filters{filterCount ? <span className="cnt">{filterCount}</span> : null}
          </button>
          {filtersOpen && (
            <div className="pop" role="dialog" aria-label="Filters">
              <div className="pop-g">
                <div className="lbl">Answers first</div>
                {(["BOT", "AI-AGENT"] as Routing[]).map((r) => (
                  <label key={r} className="ck"><input type="checkbox" checked={routeF.includes(r)} onChange={() => { setRouteF(toggleIn(routeF, r)); setPage(0); }} />{ROUTING_LABEL[r]}</label>
                ))}
              </div>
              <div className="pop-g">
                <div className="lbl">Bot type</div>
                {types.length === 0 && <div className="help">No types available</div>}
                {types.map((t) => (
                  <label key={t} className="ck"><input type="checkbox" checked={typeF.includes(t)} onChange={() => { setTypeF(toggleIn(typeF, t)); setPage(0); }} />{typeLabel(t)}</label>
                ))}
              </div>
              <button type="button" className="link" disabled={!filterCount} onClick={() => { setRouteF([]); setTypeF([]); }}>Clear filters</button>
            </div>
          )}
        </div>

        {view === "card" && (
          <div className="sel tb-sort">
            <select className="inp" aria-label="Sort by" value={sortField ?? "createdAt"} onChange={(e) => { setSortField(e.target.value as SortField); setPage(0); }}>
              {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
            </select>
          </div>
        )}
        {view === "card" && (
          <button type="button" className="ibtn bord" aria-label={sortDir === "asc" ? "Ascending" : "Descending"} data-tip={sortDir === "asc" ? "Sorted ascending: click to reverse" : "Sorted descending: click to reverse"} onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            {sortDir === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
        )}

        <span className="sp" />
        <button type="button" className="ibtn bord" aria-label="Refresh" data-tip="Refresh list" onClick={refresh}><RefreshCw size={16} className={refreshing ? "rot" : ""} /></button>
        <div className="seg view-seg" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "table"} title="Table view" aria-label="Table view" onClick={() => setView("table")}><Table2 size={16} /><span>Table</span></button>
          <button type="button" aria-pressed={view === "card"} title="Card view" aria-label="Card view" onClick={() => setView("card")}><LayoutGrid size={16} /><span>Cards</span></button>
        </div>
        <button type="button" className="btn primary" onClick={() => onAdd(client.name)}><Plus size={16} /> Add Bot</button>
      </div>

      {(routeF.length > 0 || typeF.length > 0) && (
        <div className="chips" style={{ marginBottom: 12 }}>
          {routeF.map((r) => <span key={r} className="chip">{ROUTING_LABEL[r]}<button type="button" className="x" aria-label={`Remove ${ROUTING_LABEL[r]}`} data-tip="Remove filter" onClick={() => setRouteF(routeF.filter((x) => x !== r))}><X size={12} /></button></span>)}
          {typeF.map((t) => <span key={t} className="chip">{typeLabel(t)}<button type="button" className="x" aria-label={`Remove ${t}`} data-tip="Remove filter" onClick={() => setTypeF(typeF.filter((x) => x !== t))}><X size={12} /></button></span>)}
          <button type="button" className="link" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {/* ---------- body ---------- */}
      {loading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Loading bots…</span>
          {view === "table" ? <TableSkeleton rows={Math.min(perPage, 8)} /> : <CardSkeleton count={Math.min(perPage, 8)} />}
        </div>
      ) : rows.length === 0 ? (
        <div className="tcard empty-state">
          <div className="e-ic"><Search size={22} /></div>
          <b>{hasFilters ? "No bots match your filters" : "No bots yet"}</b>
          <p className="muted">{hasFilters ? "Try a different search term or clear the filters." : `${client.name} has no bots. Create the first one to get started.`}</p>
          {hasFilters ? <button type="button" className="btn" onClick={clearAll}>Clear filters</button> : <button type="button" className="btn primary" onClick={() => onAdd(client.name)}><Plus size={16} /> Add Bot</button>}
        </div>
      ) : view === "table" ? (
        <div className="tcard">
          <div className="tscroll">
            <table className="bt">
              <thead>
                <tr>
                  {COLS.map(({ label, field }) => {
                    const on = field !== null && sortField === field;
                    return (
                      <th key={label} className={on ? "on" : ""} aria-sort={on ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                        {field ? (
                          <button type="button" onClick={() => sortBy(field)}>{label}{on && <ArrowUp size={13} className={"sort-ic" + (sortDir === "desc" ? " desc" : "")} />}</button>
                        ) : label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {slice.map((b, i) => (
                  <tr key={animKey + b.botId} className={"clk row-in" + (leaving === b.botId ? " leaving" : "")} style={stagger(i)} onClick={() => onOpen(b, client.name)}>
                    <td>
                      <div className="bcell">
                        <span className="bav"><Avatar i={b.avatar} /></span>
                        <span className="bn"><button type="button" className="nlink" onClick={(e) => { e.stopPropagation(); onOpen(b, client.name); }}><Hi text={b.name} q={search} /></button><small>{b.routing === "BOT" ? b.skills + " skill" + (b.skills === 1 ? "" : "s") : "AI agent"}</small></span>
                      </div>
                    </td>
                    <td><span className="tag"><Hi text={typeLabel(b.botType)} q={search} /></span></td>
                    <td className="muted"><Hi text={b.industry} q={search} /></td>
                    <td><span className="lang-row2">{b.languages.map((l) => <span key={l} className="lang" title={langName(l)}>{l.toUpperCase()}</span>)}</span></td>
                    <td className="muted"><Hi text={b.timezone} q={search} /></td>
                    <td><RouteBadge r={b.routing} /></td>
                    <td className="when" title={fmtDate(b.createdAt)}><span suppressHydrationWarning>{ago(b.createdAt)}</span><small>{fmtDate(b.createdAt)}</small></td>
                    <td><Actions b={b} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager total={rows.length} page={safePage} pages={pages} perPage={perPage} setPage={setPage} setPerPage={(n) => { setTablePer(n); setPage(0); }} />
        </div>
      ) : (
        <>
          <div className="bgrid" ref={gridRef}>
            {slice.map((b, i) => (
              <article key={b.botId} data-id={b.botId} className={"bcard bc2 clk row-in" + (leaving === b.botId ? " leaving" : "")}
                style={{ ...stagger(i), "--ch": avatarHue(b.avatar) } as CSSProperties} onClick={() => onOpen(b, client.name)}>
                <div className="bc-top">
                  <span className="bav xl"><Avatar i={b.avatar} /></span>
                  <div className="bc-main">
                    <button type="button" className="nlink" title={b.name} onClick={(e) => { e.stopPropagation(); onOpen(b, client.name); }}><Hi text={b.name} q={search} /></button>
                    <span className="tag"><Hi text={typeLabel(b.botType)} q={search} /></span>
                  </div>
                  <RouteBadge r={b.routing} />
                </div>
                <ul className="bc-facts">
                  <li><Building2 size={14} /><span><Hi text={b.industry} q={search} /></span></li>
                  <li title={tzLabel(b.timezone)}><Globe size={14} /><span><Hi text={b.timezone} q={search} /></span></li>
                  <li>{b.routing === "BOT" ? <Sparkles size={14} /> : <BotIcon size={14} />}<span>{b.routing === "BOT" ? b.skills + " skill" + (b.skills === 1 ? "" : "s") : "AI agent"}</span></li>
                  <li><LanguagesIcon size={14} /><span className="lang-row2">{b.languages.map((l) => <span key={l} className="lang" title={langName(l)}>{l.toUpperCase()}</span>)}</span></li>
                </ul>
                <footer>
                  <span className="bc-when" title={fmtDate(b.createdAt)}>Created <span suppressHydrationWarning>{ago(b.createdAt).toLowerCase()}</span></span>
                  <Actions b={b} />
                  <span className="bc-go" aria-hidden="true"><ArrowUpRight size={16} /></span>
                </footer>
              </article>
            ))}
          </div>
          <div className="tcard" style={{ marginTop: 16 }}>
            <Pager total={rows.length} page={safePage} pages={pages} perPage={perPage} setPage={setPage} setPerPage={(n) => { setCardPer(n); setPage(0); }} flat unit="Cards" options={CARD_PER_PAGE} />
          </div>
        </>
      )}

      {target && (
        <ConfirmDialog title="Delete Bot" confirmLabel="Delete" danger onConfirm={confirmDelete} onCancel={() => setTarget(null)}>
          Are you sure you want to delete bot <b style={{ color: "var(--fg)" }}>{target.name}</b>? You can undo this right after.
        </ConfirmDialog>
      )}
    </div>
  );
}

const SK_WIDTHS = [[120, 70], [150, 60], [110, 80], [140, 65], [130, 75], [100, 55], [145, 70], [125, 60]];

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="tcard sk-wrap">
      <div className="sk-progress" aria-hidden="true" />
      <div className="tscroll">
        <table className="bt sk-table">
          <thead>
            <tr>{COLS.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => {
              const [w1, w2] = SK_WIDTHS[i % SK_WIDTHS.length];
              return (
                <tr key={i} style={{ animationDelay: i * 60 + "ms" }} className="sk-row">
                  <td><div className="bcell"><span className="sk sk-av" /><span className="sk-lines"><span className="sk" style={{ width: w1 }} /><span className="sk sm" style={{ width: w2 }} /></span></div></td>
                  <td><span className="sk pill" style={{ width: 110 + (i % 3) * 20 }} /></td>
                  <td><span className="sk" style={{ width: 90 }} /></td>
                  <td><span className="sk pill" style={{ width: 70 }} /></td>
                  <td><span className="sk" style={{ width: 90 }} /></td>
                  <td><span className="sk pill" style={{ width: 72 }} /></td>
                  <td><span className="sk-lines"><span className="sk" style={{ width: 80 }} /><span className="sk sm" style={{ width: 64 }} /></span></td>
                  <td><span className="sk" style={{ width: 44 }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardSkeleton({ count }: { count: number }) {
  return (
    <div className="bgrid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bcard bc2 sk-card" style={{ animationDelay: i * 70 + "ms" }}>
          <div className="sk-progress" aria-hidden="true" />
          <div className="bc-top" style={{ background: "none" }}>
            <span className="sk sk-av xl" />
            <span className="sk-lines" style={{ flex: 1 }}><span className="sk" style={{ width: "62%", height: 13 }} /><span className="sk sm" style={{ width: "44%" }} /></span>
            <span className="sk pill" style={{ width: 58 }} />
          </div>
          <div className="bc-facts">
            {[70, 60, 50, 42].map((w, n) => <div key={n} className="sk-kv" style={{ justifyContent: "flex-start", gap: 8 }}><span className="sk sm" style={{ width: 12 }} /><span className="sk sm" style={{ width: w + "%" }} /></div>)}
          </div>
          <footer><span className="sk sm" style={{ width: 110 }} /><span className="sk sm" style={{ width: 52 }} /></footer>
        </div>
      ))}
    </div>
  );
}

const CARD_PER_PAGE = [4, 8, 12, 24, 48];

function Pager({ total, page, pages, perPage, setPage, setPerPage, flat, unit = "Rows", options = [5, 10, 25, 50] }: {
  total: number; page: number; pages: number; perPage: number; flat?: boolean; unit?: "Rows" | "Cards"; options?: number[];
  setPage: (n: number) => void; setPerPage: (n: number) => void;
}) {
  const start = total === 0 ? 0 : page * perPage + 1;
  const end = Math.min((page + 1) * perPage, total);
  return (
    <div className={`pager${flat ? " flat" : ""}`}>
      <span className="muted">{unit} per page</span>
      <div className="sel pp">
        <select className="inp" aria-label={unit + " per page"} value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
          {options.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <span className="muted">{start}–{end} of {total}</span>
      <button type="button" className="ibtn bord" aria-label="Previous page" data-tip="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
      <button type="button" className="ibtn bord" aria-label="Next page" data-tip="Next page" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
    </div>
  );
}
