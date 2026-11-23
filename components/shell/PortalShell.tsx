"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, BookOpen, Bot, BrainCircuit, Bell, ChevronDown, ChevronRight, Cpu, Database, FileText, HeartPulse,
  CircleHelp, LayoutDashboard, LifeBuoy, LineChart, Menu, Moon, Network, Pin, PinOff, Settings, Sun, Trash2, UserCheck, Users, Wrench, Zap,
} from "lucide-react";

/* Mirrors navSections in the real portal's Sidebar.tsx */
interface NavItem { label: string; icon?: ReactNode; children?: NavItem[] }
interface NavSection { title: string; icon: ReactNode; children?: NavItem[] }

const NAV: NavSection[] = [
  { title: "Dashboard", icon: <LayoutDashboard size={18} strokeWidth={2.2} />, children: [
    { label: "Usage Dashboard", icon: <LayoutDashboard size={16} /> },
    { label: "Services Health & Alerts", icon: <HeartPulse size={16} /> },
    { label: "Subscription Alerts", icon: <Bell size={16} /> },
  ] },
  { title: "Platform", icon: <Network size={18} strokeWidth={2.2} />, children: [
    { label: "Client Account", icon: <UserCheck size={16} /> },
    { label: "Client Teams", icon: <Users size={16} /> },
    { label: "AI Resource Catalog", icon: <Cpu size={16} /> },
    { label: "Infra Resources", icon: <Database size={16} /> },
    { label: "AI Workspace", icon: <BrainCircuit size={16} />, children: [
      { label: "Agents", icon: <Bot size={14} /> },
      { label: "Tools", icon: <Wrench size={14} /> },
      { label: "Skills", icon: <Zap size={14} /> },
    ] },
  ] },
  { title: "EngageAI", icon: <Bot size={18} strokeWidth={2.2} />, children: [
    { label: "Bots", icon: <Bot size={16} /> },
    { label: "Knowledge Area", icon: <BookOpen size={16} /> },
    { label: "Activity Log", icon: <Activity size={16} /> },
    { label: "Clear Cache", icon: <Trash2 size={16} /> },
  ] },
  { title: "Docs AI", icon: <FileText size={18} strokeWidth={2.2} />, children: [{ label: "Agents", icon: <Bot size={16} /> }] },
  { title: "Insights AI", icon: <LineChart size={18} strokeWidth={2.2} />, children: [{ label: "Agents", icon: <Bot size={16} /> }] },
  { title: "Activity Logs", icon: <Activity size={18} strokeWidth={2.2} /> },
];

interface Props {
  dark: boolean;
  onToggleTheme: () => void;
  /** Called for any nav item; the prototype only wires "Bots". */
  onNavigate: (label: string) => void;
  onTour: () => void;
  activeLabel: string;
  children: ReactNode;
}

export default function PortalShell({ dark, onToggleTheme, onNavigate, onTour, activeLabel, children }: Props) {
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ EngageAI: true });
  const [pinned, setPinned] = useState(false);
  const expanded = hovered || pinned || mobileOpen;

  useEffect(() => {
    try { setPinned(localStorage.getItem("portal-sidebar-pinned") === "1"); } catch { /* storage unavailable */ }
  }, []);
  const togglePin = () => {
    setPinned((p) => {
      try { localStorage.setItem("portal-sidebar-pinned", p ? "0" : "1"); } catch { /* ignore */ }
      return !p;
    });
  };
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const sectionActive = (s: NavSection) => s.title === "EngageAI" && activeLabel === "Bots";

  return (
    <>
      <a className="skip" href="#main">Skip to main content</a>
      <header className="hdr">
        <button type="button" className="hbtn menu-btn" aria-label="Open navigation" data-tip="Menu" data-tip-pos="bottom" onClick={() => setMobileOpen((v) => !v)}>
          <Menu size={22} strokeWidth={2.2} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/inextlabs-logo.png" alt="iNextLabs" width={120} height={32} />
        <span className="hdiv" />
        <span className="hname">Management Portal</span>
        <span className="sp" />
        <button type="button" className="tour-btn" onClick={onTour} title="Take a tour of the application">
          <CircleHelp size={16} /> <span>Tour</span>
        </button>
        <button type="button" className="hbtn" aria-label="Toggle theme" data-tip={dark ? "Switch to light mode" : "Switch to dark mode"} data-tip-pos="bottom" onClick={onToggleTheme}>
          {dark ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
        </button>
        <button type="button" className="hbtn" aria-label="Notifications" data-tip="Notifications" data-tip-pos="bottom"><Bell size={20} /></button>
        <button type="button" className="hbtn" aria-label="Settings" data-tip="Settings" data-tip-pos="bottom"><Settings size={20} /></button>
        <span className="hdiv" style={{ marginInline: 8 }} />
        <div className="user">
          <span className="ava">PA</span>
          <span className="uname"><b>Portal Admin</b><small>Super Admin</small></span>
        </div>
      </header>

      <nav
        className={`sb${expanded ? " open" : ""}${pinned ? " pinned-open" : ""}${mobileOpen ? " mobile-open" : ""}`}
        aria-label="Main navigation"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {NAV.map((s) => {
          const act = sectionActive(s);
          if (!s.children) {
            return (
              <button key={s.title} type="button" className="sb-sec" title={expanded ? undefined : s.title} onClick={() => onNavigate(s.title)}>
                <span className="ic">{s.icon}</span><span className="tx">{s.title}</span>
              </button>
            );
          }
          const isOpen = expanded && open[s.title];
          return (
            <div key={s.title}>
              <button type="button" className={`sb-sec${act ? " on" : ""}`} title={expanded ? undefined : s.title} onClick={() => expanded && toggle(s.title)} aria-expanded={isOpen}>
                <span className="ic">{s.icon}</span>
                <span className="tx">{s.title}</span>
                <span className="chv">{open[s.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
              </button>
              <div className={`col${isOpen ? " open" : ""}`}>
                <div>
                  {s.children.map((it) => {
                    if (it.children) {
                      const sub = open[it.label];
                      return (
                        <div key={it.label}>
                          <button type="button" className="sb-item" onClick={() => toggle(it.label)}>
                            <span className="ic">{it.icon}</span><span className="tx">{it.label}</span>
                            <span className="chv">{sub ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                          </button>
                          <div className={`col${sub ? " open" : ""}`}>
                            <div>
                              {it.children.map((c) => (
                                <button key={c.label} type="button" className="sb-item sub" onClick={() => onNavigate(c.label)}>
                                  <span className="ic">{c.icon}</span><span className="tx">{c.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    const on = s.title === "EngageAI" && it.label === activeLabel;
                    return (
                      <button key={it.label} type="button" className={`sb-item${on ? " on" : ""}`} aria-current={on ? "page" : undefined} onClick={() => onNavigate(it.label)}>
                        <span className="ic">{it.icon}</span><span className="tx">{it.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div className="sb-foot">
          <button type="button" className="sb-sec" title={expanded ? undefined : "Help & support"} onClick={() => onNavigate("Help & support")}>
            <span className="ic"><LifeBuoy size={18} strokeWidth={2.2} /></span><span className="tx">Help &amp; support</span>
          </button>
          <button type="button" className="sb-sec pin" aria-pressed={pinned} title={pinned ? "Unpin sidebar" : "Pin sidebar open"} onClick={togglePin}>
            <span className="ic">{pinned ? <PinOff size={18} strokeWidth={2.2} /> : <Pin size={18} strokeWidth={2.2} />}</span>
            <span className="tx">{pinned ? "Unpin sidebar" : "Pin sidebar open"}</span>
          </button>
        </div>
      </nav>
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}

      <main id="main" tabIndex={-1} className={`portal-main${hovered || pinned ? " shifted" : ""}`}>{children}</main>
    </>
  );
}
