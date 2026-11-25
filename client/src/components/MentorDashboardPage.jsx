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
  const [attendance, setAttendance] = useState([]);
  const [scoreUser, setScoreUser] = useState("");
  const [scoreForm, setScoreForm] = useState({ projects: 0, understanding: 0, discussion: 0, weeklyTasks: 0, mentorSummary: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [clarifyOpen, setClarifyOpen] = useState(false);

  async function load() {
    const [w, o, s, r, a] = await Promise.all([
      api("/api/weeks"),
      api("/api/mentor/overview?week=1"),
      api("/api/mentor/submissions?week=1"),
      api("/api/mentor/late-access?week=1"),
      api("/api/weeks/1/attendance"),
    ]);
    setWeeks(w.weeks || []); setOverview(o); setSubmissions(s.submissions || []); setRequests(r.requests || []); setAttendance(a.attendance || []);
    if (!scoreUser && o.mentees?.[0]) setScoreUser(String(o.mentees[0].id));
  }

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    let cancelled = false;
    (async () => {
      try {
        const [w, o, s, r, a] = await Promise.all([
          api("/api/weeks"),
          api("/api/mentor/overview?week=1"),
          api("/api/mentor/submissions?week=1"),
          api("/api/mentor/late-access?week=1"),
          api("/api/weeks/1/attendance"),
        ]);
        if (cancelled) return;
        setWeeks(w.weeks || []); setOverview(o); setSubmissions(s.submissions || []); setRequests(r.requests || []); setAttendance(a.attendance || []);
        setScoreUser((prev) => prev || (o.mentees?.[0] ? String(o.mentees[0].id) : ""));
      } catch (e) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; };
  }, [session, nav]);

  async function withBusy(key, fn) {
    setBusy(key); setError("");
    try { await fn(); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(""); }
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

  async function setAttendanceStatus(userId, status) {
    await withBusy(`att-${userId}-${status}`, () => api(`/api/weeks/1/attendance/${userId}`, { method: "PATCH", body: { status } }));
  }

  async function saveScore(e) {
    e.preventDefault();
    if (!scoreUser) return;
    await withBusy("score", () => api(`/api/mentees/${scoreUser}/scores`, { method: "PUT", body: scoreForm }));
  }

  const metrics = useMemo(() => ([
    ["Submitted", overview?.counts?.submitted ?? 0, "Repos received"],
    ["Past Cutoff", overview?.counts?.lockedPastCutoff ?? 0, "Need attention"],
    ["Late Access", overview?.counts?.lateAccess ?? 0, "Pending decisions"],
    ["Follow-Ups", overview?.counts?.followUps ?? 0, "Review queue"],
    ["Clarifications", overview?.counts?.openClarifications ?? 0, "Open tickets"],
  ]), [overview]);

  return (
    <main className="sd-page md-page">
      <div className="container sd-wrap md-wrap">
        <section className="sd-hero md-hero">
          <div className="sd-hero-main">
            <p className="ws-eyebrow"><span />Mentor workspace</p>
            <h1 className="sd-title">Cohort<span>Command Center</span></h1>
            <p className="sd-sub">Review submissions, manage late access, take attendance, and score mentees from one clear workspace.</p>
            <div className="sd-meta-row">
              <span className="sd-chip"><span className="sd-dot" />Week 1 operations</span>
              <span className="sd-chip sd-chip-status is-active_open">{overview?.mentees?.length ?? 0} mentees</span>
              {busy && <span className="sd-chip sd-chip-save">Working...</span>}
            </div>
          </div>
          <div className="sd-hero-side">
            <div className="sd-progress-card md-focus-card">
              <div className="md-focus">
                <span className="sd-deadline-label">Focus now</span>
                <strong>{(overview?.counts?.lateAccess ?? 0) + (overview?.counts?.followUps ?? 0) + (overview?.counts?.openClarifications ?? 0)}</strong>
                <span>items need mentor action</span>
              </div>
              <div className="sd-stats">
                <div className="sd-stat"><span>Submissions</span><strong>{overview?.counts?.submitted ?? 0}</strong></div>
                <div className="sd-stat"><span>Past cutoff</span><strong>{overview?.counts?.lockedPastCutoff ?? 0}</strong></div>
                <div className="sd-stat"><span>Attendance marked</span><strong>{attendance.filter((a)=>a.status !== "absent" || a).length}/{attendance.length || 0}</strong></div>
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
                    <div>
                      <div className="md-item-title"><strong>{s.display_name}</strong><span className={`md-status is-${s.status}`}>{s.status.replace(/_/g, " ")}</span></div>
                      <a className="md-link" href={s.github_url} target="_blank" rel="noreferrer">{s.github_url}</a>
                    </div>
                    <div className="md-actions">
                      <button className="btn" disabled={!!busy} onClick={()=>review(s.id,"approved")}>Approve</button>
                      <button className="btn" disabled={!!busy} onClick={()=>review(s.id,"needs_revision")}>Needs revision</button>
                      <button className="btn" disabled={!!busy} onClick={()=>review(s.id,"follow_up_requested")}>Follow-up</button>
                    </div>
                  </div>
                  <p className="md-note"><span>Approach</span>{s.approach_note}</p>
                </article>
              )) : <p className="ds-muted">No submissions yet.</p>}
            </div>
          </section>

          <div className="md-side-stack">
            <section className="sd-card md-card">
              <header className="sd-card-head"><div className="sd-step"><span>02</span><div><p className="ws-kicker">Decide</p><h2>Late access</h2></div></div><div className="sd-head-meta">{requests.length} requests</div></header>
              <div className="md-list">
                {requests.length ? requests.map((r) => (
                  <article key={r.id} className="md-item md-item-compact">
                    <div className="md-item-top">
                      <div><div className="md-item-title"><strong>{r.display_name}</strong><span className={`md-status is-${r.status}`}>{r.status}</span></div><p className="md-note md-note-plain">{r.reason}</p></div>
                      <div className="md-actions"><button className="btn" disabled={!!busy} onClick={()=>decideLate(r.id,"granted")}>Grant</button><button className="btn" disabled={!!busy} onClick={()=>decideLate(r.id,"declined")}>Decline</button></div>
                    </div>
                  </article>
                )) : <p className="ds-muted">No late-access requests.</p>}
              </div>
            </section>

            <section className="sd-card md-card">
              <header className="sd-card-head"><div className="sd-step"><span>03</span><div><p className="ws-kicker">Track</p><h2>Roll-call attendance</h2></div></div><div className="sd-head-meta">Week 1</div></header>
              <div className="md-list">
                {attendance.map((a) => (
                  <div key={a.user_id} className="md-att-row">
                    <div><strong>{a.display_name}</strong><span className={`md-status is-${a.status}`}>{a.status}</span></div>
                    <div className="md-actions">
                      {["present","absent","excused"].map((s)=><button key={s} className={`btn md-att-btn ${a.status===s?"is-active":""}`} disabled={!!busy} onClick={()=>setAttendanceStatus(a.user_id,s)}>{s}</button>)}
                    </div>
                  </div>
                ))}
                {!attendance.length && <p className="ds-muted">No mentees found.</p>}
              </div>
            </section>
          </div>
        </div>

        <div className="md-main-grid">
          <section className="sd-card md-card">
            <header className="sd-card-head"><div className="sd-step"><span>04</span><div><p className="ws-kicker">Score</p><h2>4-pillar scoring</h2></div></div><div className="sd-head-meta">45 / 25 / 15 / 15</div></header>
            <form onSubmit={saveScore} className="md-score-form">
              <label className="md-field"><span>Mentee</span><select value={scoreUser} onChange={(e)=>setScoreUser(e.target.value)}>{overview?.mentees?.map((m)=><option key={m.id} value={m.id}>{m.display_name}</option>)}</select></label>
              <div className="md-score-grid">
                {[["projects","Projects","45%"],["understanding","Understanding","25%"],["discussion","Discussion","15%"],["weeklyTasks","Weekly Tasks","15%"]].map(([k,label,weight])=>(
                  <label key={k} className="md-field md-score-field"><span>{label} <em>{weight}</em></span><input type="number" min="0" max="100" value={scoreForm[k]} onChange={(e)=>setScoreForm({...scoreForm,[k]:Number(e.target.value)})} /></label>
                ))}
              </div>
              <label className="md-field"><span>Mentor summary</span><textarea rows={4} value={scoreForm.mentorSummary} onChange={(e)=>setScoreForm({...scoreForm,mentorSummary:e.target.value})} placeholder="Strengths, gaps, next action..." /></label>
              <div><button className="btn btn-primary" disabled={!!busy || !scoreUser}>{busy==="score" ? "Saving..." : "Save score"}</button></div>
            </form>
          </section>

          <section className="sd-card md-card">
            <header className="sd-card-head"><div className="sd-step"><span>05</span><div><p className="ws-kicker">Timeline</p><h2>Week states</h2></div></div></header>
            <div className="md-week-grid">
              {weeks.map((w) => (
                <div key={w.weekNumber} className="md-week">
                  <div className="md-week-top"><strong>Week {w.weekNumber}</strong><span className={`md-status is-${w.state}`}>{(w.state || "locked").replace(/_/g, " ")}</span></div>
                  <p>{curriculum.weeks.find((cw)=>cw.weekNumber===w.weekNumber)?.title || "Scheduled week"}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <ClarificationDrawer open={clarifyOpen} onClose={() => setClarifyOpen(false)} weekNumber={1} topics={curriculum.weeks[0]?.outlineTopics || []} role="MENTOR" />
      </div>
    </main>
  );
}
