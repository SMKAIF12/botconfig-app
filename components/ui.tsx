"use client";
import { createContext, useContext, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { getP } from "@/lib/helpers";
import { useWiz } from "./ctx";

/* ---------- icons ---------- */
const base = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={3} aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconBot = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base} strokeWidth={2} aria-hidden="true">
    <rect x="4" y="8" width="16" height="12" rx="4" /><path d="M12 8V4" /><circle cx="9" cy="14" r="1" fill="currentColor" /><circle cx="15" cy="14" r="1" fill="currentColor" />
  </svg>
);
export const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...base} strokeWidth={2} aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...base} strokeWidth={2} aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
);
export const IconX = ({ size = 12, w = 2.6 }: { size?: number; w?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={w} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconChevron = () => (
  <svg className="chev" width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);
export const IconWarn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base} strokeWidth={2} aria-hidden="true"><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></svg>
);

/* ---------- avatar ---------- */
const HUES = [12, 28, 150, 200, 260, 320, 45, 175, 225, 350];

export const avatarHue = (i: number) => HUES[((i % 10) + 10) % 10];

export const BOT_PICTURE_COUNT = 10;

/** Bot profile picture. `i` is 0-9 and maps to /bot-profile-pictures/bot1.png ... bot10.png. */
export function Avatar({ i }: { i: number }) {
  const n = (((i % BOT_PICTURE_COUNT) + BOT_PICTURE_COUNT) % BOT_PICTURE_COUNT) + 1;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="bot-pic" src={`/bot-profile-pictures/bot${n}.png`} alt="" width={300} height={300} draggable={false} aria-hidden="true" />
  );
}

/* ---------- layout helpers ---------- */
export function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="sec">
      <div className="sec-h"><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  errKey?: string;
  req?: boolean;
  opt?: boolean;
  tech?: string;
  help?: ReactNode;
  /** Plain-language explanation shown in a "?" popover next to the label. */
  hint?: Hint;
  group?: boolean;
  children: ReactNode;
}

export interface Hint { text: string; example?: string }

export function HelpTip({ label, hint }: { label: string; hint: Hint }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <span className="help-tip" ref={ref}>
      <button type="button" aria-label={`Help: ${label}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>?</button>
      {open && (
        <span className="tip-pop" role="tooltip" id={id}>
          {hint.text}
          {hint.example && <span className="tip-ex"><b>Example:</b> {hint.example}</span>}
        </span>
      )}
    </span>
  );
}

/** Lets bound inputs pick up aria-invalid / aria-describedby from the Field that wraps them. */
const FieldCtx = createContext<{ htmlFor: string; invalid: boolean; describedBy: string } | null>(null);

export function useFieldA11y(id: string) {
  const c = useContext(FieldCtx);
  if (!c || c.htmlFor !== id) return {};
  return { "aria-invalid": c.invalid || undefined, "aria-describedby": c.describedBy || undefined } as const;
}

/** Plain <input> / <textarea> that still get the error wiring from the surrounding Field. */
export function A11yInput(props: ComponentProps<"input"> & { id: string }) {
  return <input {...useFieldA11y(props.id)} {...props} />;
}
export function A11yTextarea(props: ComponentProps<"textarea"> & { id: string }) {
  return <textarea {...useFieldA11y(props.id)} {...props} />;
}

export function Field({ label, htmlFor, errKey, req, opt, tech, help, hint, group, children }: FieldProps) {
  const { err } = useWiz();
  const msg = errKey ? err(errKey) : "";
  const inner = (
    <>
      {label}
      {req && <> <span className="req">*</span></>}
      {opt && <span className="opt">(optional)</span>}
      {tech && <span className="tech">{tech}</span>}
    </>
  );
  const describedBy = [help ? `${htmlFor}-help` : "", msg ? `${htmlFor}-err` : ""].filter(Boolean).join(" ");
  return (
    <FieldCtx.Provider value={{ htmlFor, invalid: !!msg, describedBy }}>
    <div className={`field${msg ? " invalid" : ""}`}>
      <div className="lbl-row">
        {group ? <div className="lbl" id={`${htmlFor}-l`}>{inner}</div> : <label className="lbl" htmlFor={htmlFor}>{inner}</label>}
        {hint && <HelpTip label={label} hint={hint} />}
      </div>
      {children}
      {help && <div className="help" id={`${htmlFor}-help`}>{help}</div>}
      {msg && <div className="err" id={`${htmlFor}-err`} role="alert">{msg}</div>}
    </div>
    </FieldCtx.Provider>
  );
}

/* ---------- inputs bound to the wizard form ---------- */
interface BoundProps {
  path: string;
  id: string;
  ph?: string;
  touchKey?: string;
}

export function TextInput({ path, id, ph, touchKey }: BoundProps) {
  const { d, set, touch } = useWiz();
  const fa = useFieldA11y(id);
  return (
    <input className="inp" id={id} {...fa} type="text" value={getP(d, path) ?? ""} placeholder={ph}
      onChange={(e) => set(path, e.target.value)} onBlur={() => touch(touchKey ?? path)} />
  );
}

export function NumInput({ path, id, ph, touchKey }: BoundProps) {
  const { d, set, touch } = useWiz();
  const fa = useFieldA11y(id);
  return (
    <input className="inp" id={id} {...fa} type="number" min={0} inputMode="numeric" value={getP(d, path) ?? ""} placeholder={ph}
      onChange={(e) => set(path, e.target.value === "" ? "" : Number(e.target.value))} onBlur={() => touch(touchKey ?? path)} />
  );
}

export function SelectInput({ path, id, options, ph, touchKey }: BoundProps & { options: [string, string][]; ph: string }) {
  const { d, set, touch } = useWiz();
  const v = (getP(d, path) as string) ?? "";
  const fa = useFieldA11y(id);
  return (
    <div className="sel">
      <select className="inp" id={id} {...fa} value={v} onChange={(e) => set(path, e.target.value)} onBlur={() => touch(touchKey ?? path)}>
        <option value="" disabled>{ph}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

export function Toggle({ path, title, help }: { path: string; title: string; help: string }) {
  const { d, set } = useWiz();
  return (
    <label className="tog">
      <span><b>{title}</b><span className="help">{help}</span></span>
      <span className="switch">
        <input type="checkbox" role="switch" checked={!!getP(d, path)} onChange={(e) => set(path, e.target.checked)} />
        <span className="track" />
      </span>
    </label>
  );
}

export function Choice({ checked, onSelect, title, sub, children }: { checked: boolean; onSelect: () => void; title?: string; sub?: string; children?: ReactNode }) {
  return (
    <button type="button" className="choice" role="radio" aria-checked={checked} onClick={onSelect}>
      <span className="rd" />
      {children ?? (<span><b>{title}</b><span className="s">{sub}</span></span>)}
    </button>
  );
}

export function JsonPill({ state }: { state: "empty" | "ok" | "bad" }) {
  if (state === "empty") return null;
  return state === "ok"
    ? <span className="json-pill ok"><IconCheck /> Valid JSON</span>
    : <span className="json-pill bad">Not valid JSON yet</span>;
}
