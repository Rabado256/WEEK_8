import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getSession } from "../utils/api";
import ClarificationDrawer from "./ClarificationDrawer";
import curriculum from "../data/curriculum.json";

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
  const isBusy = (key) => busyKeys.has(key);
  const itemBusy = (prefix, id) => [...busyKeys].some((k) => k.startsWith(`${prefix}-${id}`));

  async function load() {
    const [w, o, s, r] = await Promise.all([
      api("/api/weeks"),
      api("/api/mentor/overview?week=1"),
      api("/api/mentor/submissions?week=1"),
      api("/api/mentor/late-access?week=1"),
    ]);
    setWeeks(w.weeks || []); setOverview(o); setSubmissions(s.submissions || []); setRequests(r.requests || []);
  }

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    let cancelled = false;
    (async () => {
      try {
        const [w, o, s, r] = await Promise.all([
          api("/api/weeks"),
          api("/api/mentor/overview?week=1"),
          api("/api/mentor/submissions?week=1"),
          api("/api/mentor/late-access?week=1"),
        ]);
        if (cancelled) return;
        setWeeks(w.weeks || []); setOverview(o); setSubmissions(s.submissions || []); setRequests(r.requests || []);
      } catch (e) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; };
  }, [session, nav]);

  async function withBusy(key, fn) {
    setBusyKeys((s) => new Set(s).add(key)); setError("");
    try { await fn(); await load(); }
    catch (e) { setError(e.message); }
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

  const metrics = useMemo(() => ([
    ["Submitted", overview?.counts?.submitted ?? 0, "Repos received"],
    ["Past Cutoff", overview?.counts?.lockedPastCutoff ?? 0, "Need attention"],
    ["Late Access", overview?.counts?.lateAccess ?? 0, "Pending decisions"],
    ["Follow-Ups", overview?.counts?.followUps ?? 0, "Review queue"],
    ["Clarifications", overview?.counts?.openClarifications ?? 0, "Open tickets"],
  ]), [overview]);

  const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "M";
  const focusCount = (overview?.counts?.lateAccess ?? 0) + (overview?.counts?.followUps ?? 0) + (overview?.counts?.openClarifications ?? 0);

  return (
    <main className="sd-page md-page">
      <div className="container sd-wrap md-wrap">
        <section className="sd-hero md-hero">
          <div className="sd-hero-main">
            <p className="ws-eyebrow"><span />Mentor workspace</p>
            <h1 className="sd-title">Cohort<span>Command Center</span></h1>
            <p className="sd-sub">Review submissions, manage late access, and respond to clarifications from one calm, focused dashboard.</p>
            <div className="sd-meta-row">
              <span className="sd-chip"><span className="sd-dot" />Week 1 operations</span>
              <span className="sd-chip sd-chip-status is-active_open">{overview?.mentees?.length ?? 0} mentees</span>
              <span className="sd-chip">{focusCount} action items</span>
              {busyKeys.size > 0 && <span className="sd-chip sd-chip-save">Updating...</span>}
            </div>
          </div>
          <div className="sd-hero-side">
            <div className="sd-progress-card md-focus-card">
              <div className="md-focus">
                <span className="sd-deadline-label">Needs attention</span>
                <strong>{focusCount}</strong>
                <span>reviews, requests, and clarifications</span>
              </div>
              <div className="sd-stats">
                <div className="sd-stat"><span>Submissions</span><strong>{overview?.counts?.submitted ?? 0}</strong></div>
                <div className="sd-stat"><span>Past cutoff</span><strong>{overview?.counts?.lockedPastCutoff ?? 0}</strong></div>
                <div className="sd-stat"><span>Open clarifications</span><strong>{overview?.counts?.openClarifications ?? 0}</strong></div>
              </div>
            </div>
            <button className="btn sd-ghost" onClick={() => setClarifyOpen(true)}>Open clarifications</button>
          </div>
        </section>

        {error && <div className="d-alert">{error}</div>}

        <section className="md-metrics" aria-label="Cohort metrics">
          {metrics.map(([label, value, hint]) => (
            <article key={label} className="md-metric">
              <span className="sd-deadline-label">{label}</span>
              <strong>{value}</strong>
              <p>{hint}</p>
            </article>
          ))}
        </section>

        <div className="md-main-grid">
          <section className="sd-card md-card">
            <header className="sd-card-head"><div className="sd-step"><span>01</span><div><p className="ws-kicker">Review</p><h2>Week 1 submissions</h2></div></div><div className="sd-head-meta">{submissions.length} items</div></header>
            <div className="md-list">
              {submissions.length ? submissions.map((s) => (
                <article key={s.id} className="md-item">
                  <div className="md-item-top">
                    <div className="md-person">
                      <div className="md-avatar" aria-hidden="true">{initials(s.display_name)}</div>
                      <div>
                        <div className="md-item-title"><strong>{s.display_name}</strong><span className={`md-status is-${s.status}`}>{s.status.replace(/_/g, " ")}</span></div>
                        <a className="md-link" href={s.github_url} target="_blank" rel="noreferrer">{s.github_url}</a>
                      </div>
                    </div>
                    <div className="md-actions">
                      <button className="btn md-btn-approve" disabled={itemBusy("review", s.id)} onClick={()=>review(s.id,"approved")}>{isBusy(`review-${s.id}-approved`) ? "..." : "Approve"}</button>
                      <button className="btn md-btn-warn" disabled={itemBusy("review", s.id)} onClick={()=>review(s.id,"needs_revision")}>{isBusy(`review-${s.id}-needs_revision`) ? "..." : "Needs revision"}</button>
                      <button className="btn" disabled={itemBusy("review", s.id)} onClick={()=>review(s.id,"follow_up_requested")}>{isBusy(`review-${s.id}-follow_up_requested`) ? "..." : "Follow-up"}</button>
                    </div>
                  </div>
                  <p className="md-note"><span>Approach</span>{s.approach_note}</p>
                </article>
              )) : <div className="md-empty">No submissions yet. New student repos will appear here.</div>}
            </div>
          </section>

          <div className="md-side-stack">
            <section className="sd-card md-card">
              <header className="sd-card-head"><div className="sd-step"><span>02</span><div><p className="ws-kicker">Decide</p><h2>Late access</h2></div></div><div className="sd-head-meta">{requests.length} requests</div></header>
              <div className="md-list">
                {requests.length ? requests.map((r) => (
                  <article key={r.id} className="md-item md-item-compact">
                    <div className="md-item-top">
                      <div className="md-person">
                        <div className="md-avatar" aria-hidden="true">{initials(r.display_name)}</div>
                        <div><div className="md-item-title"><strong>{r.display_name}</strong><span className={`md-status is-${r.status}`}>{r.status}</span></div><p className="md-note md-note-plain">{r.reason}</p></div>
                      </div>
                      <div className="md-actions"><button className="btn md-btn-approve" disabled={itemBusy("late", r.id)} onClick={()=>decideLate(r.id,"granted")}>{isBusy(`late-${r.id}-granted`) ? "..." : "Grant"}</button><button className="btn" disabled={itemBusy("late", r.id)} onClick={()=>decideLate(r.id,"declined")}>{isBusy(`late-${r.id}-declined`) ? "..." : "Decline"}</button></div>
                    </div>
                  </article>
                )) : <div className="md-empty">No late-access requests.</div>}
              </div>
            </section>
          </div>
        </div>

        <section className="sd-card md-card">
          <header className="sd-card-head"><div className="sd-step"><span>03</span><div><p className="ws-kicker">Timeline</p><h2>Week states</h2></div></div></header>
          <div className="md-week-grid">
            {weeks.map((w) => (
              <div key={w.weekNumber} className="md-week">
                <div className="md-week-top"><strong>Week {w.weekNumber}</strong><span className={`md-status is-${w.state}`}>{(w.state || "locked").replace(/_/g, " ")}</span></div>
                <p>{curriculum.weeks.find((cw)=>cw.weekNumber===w.weekNumber)?.title || "Scheduled week"}</p>
              </div>
            ))}
          </div>
        </section>

        <ClarificationDrawer open={clarifyOpen} onClose={() => setClarifyOpen(false)} weekNumber={1} topics={curriculum.weeks[0]?.outlineTopics || []} role="MENTOR" />
      </div>
    </main>
  );
}
