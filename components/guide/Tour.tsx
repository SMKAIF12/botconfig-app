"use client";
import type { TourStep } from "@/lib/tours";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const W = 320;
const GAP = 14;

interface Box { left: number; top: number; right: number; bottom: number; width: number; height: number }

/** Page zoom (the app sets html{zoom}). Measured rects are on-screen px; fixed-position CSS values are in zoomed units. */
const pageZoom = () => {
  if (typeof document === "undefined") return 1;
  const z = parseFloat(getComputedStyle(document.documentElement).zoom);
  return z > 0 ? z : 1;
};
const toBox = (r: DOMRect): Box => {
  const z = pageZoom();
  return { left: r.left / z, top: r.top / z, right: r.right / z, bottom: r.bottom / z, width: r.width / z, height: r.height / z };
};

interface Props { steps: TourStep[]; label?: string; onClose: () => void }

export default function Tour({ steps: STEPS, label = "Quick tour", onClose }: Props) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Box | null>(null);
  const raf = useRef(0);
  const step = STEPS[i];

  const measure = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = document.querySelector(step.target);
      setRect(el ? toBox(el.getBoundingClientRect()) : null);
    });
  }, [step.target]);

  useLayoutEffect(() => {
    const el = document.querySelector(step.target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 20) el.scrollIntoView({ block: "center", behavior: "auto" });
    measure();
  }, [step.target, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", key);
    measure();
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); window.removeEventListener("keydown", key); cancelAnimationFrame(raf.current); };
  }, [measure, onClose]);

  // Skip steps whose target isn't on screen (e.g. the preview is hidden on small layouts).
  useEffect(() => {
    if (!document.querySelector(step.target)) {
      if (i < STEPS.length - 1) setI(i + 1);
      else onClose();
    }
  }, [i, step.target, onClose]);

  const pad = 6;
  const z = pageZoom();
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth / z;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight / z;
  let style: React.CSSProperties = { left: "50%", bottom: 24, transform: "translateX(-50%)" };
  if (rect && vw >= 900) {
    const fits = {
      right: rect.right + GAP + W < vw,
      left: rect.left - GAP - W > 0,
      bottom: rect.bottom + GAP + 190 < vh,
      top: rect.top - GAP - 190 > 0,
    };
    const order = [step.side, "right", "left", "bottom", "top"] as const;
    const side = order.find((s) => fits[s]);
    const clampY = (y: number) => Math.max(76, Math.min(y, vh - 230));
    const clampX = (x: number) => Math.max(12, Math.min(x, vw - W - 12));
    if (side === "right") style = { left: rect.right + GAP, top: clampY(rect.top) };
    else if (side === "left") style = { left: rect.left - GAP - W, top: clampY(rect.top) };
    else if (side === "bottom") style = { left: clampX(rect.left + rect.width / 2 - W / 2), top: rect.bottom + GAP };
    else if (side === "top") style = { left: clampX(rect.left + rect.width / 2 - W / 2), top: Math.max(76, rect.top - GAP - 190) };
    // A very tall target (the form) would push the tip off-screen: pin it near the target's visible top instead.
    if (side === "bottom" && rect.bottom + GAP + 190 > vh) style = { left: "50%", bottom: 24, transform: "translateX(-50%)" };
  }
  const last = i === STEPS.length - 1;

  return (
    <div className="tour" role="dialog" aria-modal="false" aria-label={label}>
      {rect && <div className="tour-hole" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />}
      {!rect && <div className="tour-dim" />}
      <div className="tour-card" style={style}>
        <div className="eyebrow">Tip {i + 1} of {STEPS.length}</div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="tour-foot">
          <button type="button" className="link" onClick={onClose}>Skip tour</button>
          <span className="dots" aria-hidden="true">{STEPS.map((_, n) => <i key={n} className={n === i ? "on" : ""} />)}</span>
          {i > 0 && <button type="button" className="btn sm" onClick={() => setI(i - 1)}>Back</button>}
          <button type="button" className="btn sm primary" autoFocus onClick={() => (last ? onClose() : setI(i + 1))}>{last ? "Got it" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
