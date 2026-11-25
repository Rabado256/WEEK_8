import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession, getSession } from "../utils/api";
import ClarificationDrawer from "./ClarificationDrawer";
import curriculum from "../data/curriculum.json";

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const icons = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  request: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  clarify: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
};

export default function MentorDashboardPage() {
  const nav = useNavigate();
  const [session] = useState(getSession);
  const [weeks, setWeeks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [busyKeys, setBusyKeys] = useState(new Set());
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [view, setView] = useState("dashboard");
  const itemBusy = (prefix, id) => [...busyKeys].some((k) => k.startsWith(`${prefix}-${id}`));
  const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "M";

  async function load() {
    const [w, o, s, r] = await Promise.all([
      api("/api/weeks"), api("/api/mentor/overview?week=1"),
      api("/api/mentor/submissions?week=1"), api("/api/mentor/late-access?week=1"),
    ]);
    setWeeks(w.weeks || []); setOverview(o); setSubmissions(s.submissions || []); setRequests(r.requests || []);
  }

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    let cancelled = false;
    (async () => { try { await load(); } catch (e) { if (!cancelled) setError(e.message); } })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, nav]);

  async function withBusy(key, fn) {
    setBusyKeys((s) => new Set(s).add(key)); setError("");
    try { await fn(); await load(); } catch (e) { setError(e.message); }
    finally { setBusyKeys((s) => { const n = new Set(s); n.delete(key); return n; }); }
  }
  async function review(id, status) {
    const mentorFeedback = window.prompt("Mentor feedback (optional):", "") || "";
    await withBusy(`review-${id}-${status}`, () => api(`/api/submissions/${id}/review`, { method: "PATCH", body: { status, mentorFeedback } }));
  }
  async function decideLate(id, decision) {
    const mentorNote = window.prompt("Mentor note (optional):", "") || "";
    const grantedUntilWat = decision === "granted" ? window.prompt("Granted until WAT ISO (optional):", "") || "" : "";
    await withBusy(`late-${id}-${decision}`, () => api(`/api/late-access/${id}/decision`, { method: "PATCH", body: { decision, mentorNote, grantedUntilWat } }));
  }
  function logout() { clearSession(); nav("/login"); }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const recentChats = useMemo(() => submissions.slice(0, 20).map((s, i) => ({
    id: s.id, name: s.display_name,
    snippet: s.approach_note || "Submitted a repository for review.",
    time: i === 0 ? "Just now" : i === 1 ? "1h ago" : i === 2 ? "Yesterday" : `${i}d ago`,
    unread: i < 2,
  })), [submissions]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { id: "mentees", label: "Recent Mentees", icon: icons.users, count: submissions.length },
    { id: "requests", label: "Pending Requests", icon: icons.request, count: pendingRequests.length },
    { id: "chats", label: "Recent Chats", icon: icons.message, count: recentChats.length },
    { id: "clarifications", label: "Clarifications", icon: icons.clarify, count: overview?.counts?.openClarifications ?? 0 },
  ];

  const metrics = useMemo(() => ([
    { icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3", value: overview?.counts?.submitted ?? 0, label: "Submissions", note: "Repos received this week" },
    { icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", value: overview?.counts?.lockedPastCutoff ?? 0, label: "Past Cutoff", note: "Need mentor attention" },
    { icon: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6", value: pendingRequests.length, label: "Pending Requests", note: "Awaiting your decision" },
  ]), [overview, pendingRequests.length]);

  const mentorName = session?.user?.displayName || "Mentor";
  const mentorInitials = initials(mentorName);
  const activeLabel = navItems.find((n) => n.id === view)?.label || "Dashboard";

  return (
    <div className="ad-shell">
      <aside className="ad-rail">
        <div className="ad-brand">
          <div className="ad-logo">D8</div>
          <div><strong>Dev8</strong><span>Mentor Portal</span></div>
        </div>
        <nav className="ad-nav" aria-label="Mentor navigation">
          {navItems.map((item) => (
            <button key={item.id} type="button" className={`ad-nav-item${view === item.id ? " is-active" : ""}`} onClick={() => setView(item.id)}>
              <Icon d={item.icon} /><span>{item.label}</span>{item.count > 0 && <span className="ad-nav-count">{item.count}</span>}
            </button>
          ))}
        </nav>
        <button type="button" className="ad-logout" onClick={logout}><Icon d={icons.logout} /><span>Logout</span></button>
      </aside>

      <div className="ad-main">
        <header className="ad-topbar">
          <div className="ad-breadcrumb"><span>Portal</span><span className="ad-sep">/</span><strong>{activeLabel}</strong></div>
          <div className="ad-topbar-right">
            <div className="ad-user">
              <div className="ad-avatar ad-avatar-sm">{mentorInitials}</div>
              <div><strong>{mentorName}</strong><span className="ad-role">Mentor</span></div>
            </div>
          </div>
        </header>

        <div className="ad-canvas">
          {error && <div className="d-alert">{error}</div>}

          <section className="ad-page-head">
            <p className="ad-eyebrow">MENTOR DASHBOARD</p>
            <h1>{view === "dashboard" ? `Good day, ${mentorName.split(/\s+/)[0]}.` : activeLabel}</h1>
            <p>{view === "dashboard" ? "Track submissions, review requests, and keep your cohort moving forward." : "Focused view so large lists do not crowd other dashboard sections."}</p>
          </section>

          {view === "dashboard" && (
            <>
              <section className="ad-metrics" aria-label="Summary metrics">
                {metrics.map((m) => (
                  <article key={m.label} className="ad-metric">
                    <div className="ad-metric-icon"><Icon d={m.icon} size={20} /></div>
                    <div><strong>{m.value}</strong><div className="ad-metric-label">{m.label}</div><p>{m.note}</p></div>
                  </article>
                ))}
              </section>
              <div className="ad-split">
                <section className="ad-card">
                  <div className="ad-card-head"><div><p className="ad-eyebrow">OVERVIEW</p><h2>Recent Mentees</h2></div><button type="button" className="ad-link-muted ad-link-btn" onClick={() => setView("mentees")}>Open all</button></div>
                  <div className="ad-list">
                    {submissions.slice(0, 5).map((s) => (
                      <div key={s.id} className="ad-row"><div className="ad-row-main"><div className="ad-avatar">{initials(s.display_name)}</div><div className="ad-row-text"><strong>{s.display_name}</strong><span>{(s.approach_note || "Week 1 submission").slice(0, 56)}</span></div></div><span className={`ad-badge is-${s.status}`}>{s.status.replace(/_/g, " ")}</span></div>
                    ))}
                    {!submissions.length && <div className="ad-empty">No submissions yet.</div>}
                  </div>
                </section>
                <section className="ad-card">
                  <div className="ad-card-head"><div><p className="ad-eyebrow">ACTION</p><h2>Pending Requests</h2></div><button type="button" className="ad-link-muted ad-link-btn" onClick={() => setView("requests")}>Open all</button></div>
                  <div className="ad-list">
                    {pendingRequests.slice(0, 5).map((r) => (
                      <div key={r.id} className="ad-row"><div className="ad-row-main"><div className="ad-avatar">{initials(r.display_name)}</div><div className="ad-row-text"><strong>{r.display_name}</strong><span>{(r.reason || "Late access request").slice(0, 56)}</span></div></div><span className={`ad-badge is-${r.status}`}>{r.status}</span></div>
                    ))}
                    {!pendingRequests.length && <div className="ad-empty">No pending requests.</div>}
                  </div>
                </section>
              </div>
              <section className="ad-card">
                <div className="ad-card-head"><div><p className="ad-eyebrow">TIMELINE</p><h2>Week States</h2></div></div>
                <div className="md-week-grid">
                  {weeks.map((w) => (
                    <div key={w.weekNumber} className="md-week"><div className="md-week-top"><strong>Week {w.weekNumber}</strong><span className={`md-status is-${w.state}`}>{(w.state || "locked").replace(/_/g, " ")}</span></div><p>{curriculum.weeks.find((cw) => cw.weekNumber === w.weekNumber)?.title || "Scheduled week"}</p></div>
                  ))}
                </div>
              </section>
            </>
          )}
          {view === "mentees" && (
            <section className="ad-card">
              <div className="ad-card-head"><div><p className="ad-eyebrow">COHORT</p><h2>Recent Mentees</h2></div><span className="ad-link-muted">{submissions.length} submissions</span></div>
              <div className="ad-list ad-list-scroll">
                {submissions.length ? submissions.map((s) => (
                  <div key={s.id} className="ad-row">
                    <div className="ad-row-main"><div className="ad-avatar">{initials(s.display_name)}</div><div className="ad-row-text"><strong>{s.display_name}</strong><span>{s.approach_note ? s.approach_note.slice(0, 72) + (s.approach_note.length > 72 ? "…" : "") : "Week 1 submission"}</span></div></div>
                    <div className="ad-row-end"><span className={`ad-badge is-${s.status}`}>{s.status.replace(/_/g, " ")}</span><div className="ad-row-actions"><a className="ad-icon-btn ad-icon-btn-sm" href={s.github_url} target="_blank" rel="noreferrer" aria-label="Open repo"><Icon d={icons.external} size={15} /></a><button type="button" className="ad-icon-btn ad-icon-btn-sm ad-btn-ok" aria-label="Approve" onClick={() => review(s.id, "approved")} disabled={itemBusy("review", s.id)}><Icon d={icons.check} size={15} /></button></div></div>
                  </div>
                )) : <div className="ad-empty">No submissions yet.</div>}
              </div>
            </section>
          )}
          {view === "requests" && (
            <section className="ad-card">
              <div className="ad-card-head"><div><p className="ad-eyebrow">ACTION</p><h2>Pending Requests</h2></div><span className="ad-count">{pendingRequests.length}</span></div>
              <div className="ad-list ad-list-scroll">
                {pendingRequests.length ? pendingRequests.map((r) => (
                  <div key={r.id} className="ad-row">
                    <div className="ad-row-main"><div className="ad-avatar">{initials(r.display_name)}</div><div className="ad-row-text"><strong>{r.display_name}</strong><span>{r.reason ? r.reason.slice(0, 72) + (r.reason.length > 72 ? "…" : "") : "Late access request"}</span></div></div>
                    <div className="ad-row-actions"><button type="button" className="ad-icon-btn ad-icon-btn-sm ad-btn-ok" aria-label="Grant" disabled={itemBusy("late", r.id)} onClick={() => decideLate(r.id, "granted")}><Icon d={icons.check} size={15} /></button><button type="button" className="ad-icon-btn ad-icon-btn-sm ad-btn-no" aria-label="Decline" disabled={itemBusy("late", r.id)} onClick={() => decideLate(r.id, "declined")}><Icon d={icons.x} size={15} /></button></div>
                  </div>
                )) : <div className="ad-empty">No pending requests.</div>}
              </div>
            </section>
          )}
          {view === "chats" && (
            <section className="ad-card">
              <div className="ad-card-head"><div><p className="ad-eyebrow">MESSAGES</p><h2>Recent Chats</h2></div><span className="ad-link-muted">{recentChats.length} items</span></div>
              <div className="ad-list ad-list-scroll">
                {recentChats.length ? recentChats.map((c) => (
                  <div key={c.id} className="ad-row">
                    <div className="ad-row-main"><div className="ad-avatar">{initials(c.name)}</div><div className="ad-row-text"><strong>{c.name}</strong><span>{c.snippet.slice(0, 72)}{c.snippet.length > 72 ? "…" : ""}</span></div></div>
                    <div className="ad-chat-meta"><span>{c.time}</span>{c.unread && <span className="ad-unread" aria-label="Unread" />}</div>
                  </div>
                )) : <div className="ad-empty">No recent messages.</div>}
              </div>
            </section>
          )}
          {view === "clarifications" && (
            <section className="ad-card">
              <div className="ad-card-head"><div><p className="ad-eyebrow">SUPPORT</p><h2>Clarifications</h2></div><button type="button" className="btn sd-ghost ad-inline-btn" onClick={() => setClarifyOpen(true)}>Open clarifications drawer</button></div>
              <div className="ad-empty">Open the clarifications drawer to review and respond without crowding the dashboard.</div>
            </section>
          )}
        </div>
      </div>
      <ClarificationDrawer open={clarifyOpen} onClose={() => setClarifyOpen(false)} weekNumber={1} topics={curriculum.weeks[0]?.outlineTopics || []} role="MENTOR" />
    </div>
  );
}
