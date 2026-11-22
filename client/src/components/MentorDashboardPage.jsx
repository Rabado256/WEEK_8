import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, clearSession, getSession } from "../utils/api";
import ClarificationDrawer from "./ClarificationDrawer";
import ProgramCharterDrawer from "./ProgramCharterDrawer";
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
  const [scoreForm, setScoreForm] = useState({ projects: 0, understanding: 0, discussion: 0, weeklyTasks: 0, collaboration: 0, mentorSummary: "" });
  const [error, setError] = useState("");
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [charterOpen, setCharterOpen] = useState(false);

  async function load() {
    const [w, o, s, r, a] = await Promise.all([api("/api/weeks"), api("/api/mentor/overview?week=1"), api("/api/mentor/submissions?week=1"), api("/api/mentor/late-access?week=1"), api("/api/weeks/1/attendance")]);
    setWeeks(w.weeks || []); setOverview(o); setSubmissions(s.submissions || []); setRequests(r.requests || []); setAttendance(a.attendance || []);
    if (!scoreUser && o.mentees?.[0]) setScoreUser(String(o.mentees[0].id));
  }

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    let cancelled = false;
    (async () => {
      try { const [w, o, s, r, a] = await Promise.all([api("/api/weeks"), api("/api/mentor/overview?week=1"), api("/api/mentor/submissions?week=1"), api("/api/mentor/late-access?week=1"), api("/api/weeks/1/attendance")]); if (!cancelled) { setWeeks(w.weeks || []); setOverview(o); setSubmissions(s.submissions || []); setRequests(r.requests || []); setAttendance(a.attendance || []); if (o.mentees?.[0]) setScoreUser(String(o.mentees[0].id)); } }
      catch (e) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; };
  }, [session, nav]);

  async function review(id, status) {
    const mentorFeedback = window.prompt("Mentor feedback (optional):", "") || "";
    await api(`/api/submissions/${id}/review`, { method: "PATCH", body: { status, mentorFeedback } }).catch((e)=>setError(e.message));
    load().catch((e)=>setError(e.message));
  }

  async function decideLate(id, decision) {
    const mentorNote = window.prompt("Mentor note (optional):", "") || "";
    const grantedUntilWat = decision === "granted" ? window.prompt("Granted until WAT ISO (optional):", "") || "" : "";
    await api(`/api/late-access/${id}/decision`, { method: "PATCH", body: { decision, mentorNote, grantedUntilWat } }).catch((e)=>setError(e.message));
    load().catch((e)=>setError(e.message));
  }

  async function setAttendanceStatus(userId, status) {
    await api(`/api/weeks/1/attendance/${userId}`, { method: "PATCH", body: { status } }).catch((e)=>setError(e.message));
    load().catch((e)=>setError(e.message));
  }

  async function saveScore(e) {
    e.preventDefault();
    if (!scoreUser) return;
    await api(`/api/mentees/${scoreUser}/scores`, { method: "PUT", body: scoreForm }).catch((e)=>setError(e.message));
  }

  return (
    <main className="section"><div className="container grid" style={{ gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div><span className="pill">Mentor Workspace</span><h1>Cohort overview</h1><p className="muted">Roll-call, reviews, late access, and scoring controls will land in Phase 5-6.</p></div>
        <div style={{ display: "flex", gap: ".5rem" }}><button className="btn" onClick={() => setCharterOpen(true)}>Charter</button><button className="btn" onClick={() => setClarifyOpen(true)}>Clarifications</button><Link className="btn" to="/">Landing</Link><button className="btn" onClick={() => { clearSession(); nav("/login"); }}>Sign out</button></div>
      </div>
      {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
        {[
          ["Submitted", overview?.counts?.submitted ?? 0],
          ["Locked / Past Cutoff", overview?.counts?.lockedPastCutoff ?? 0],
          ["Late Access", overview?.counts?.lateAccess ?? 0],
          ["Follow-Ups", overview?.counts?.followUps ?? 0],
          ["Open Clarifications", overview?.counts?.openClarifications ?? 0],
        ].map(([k, v]) => <div key={k} className="card"><div className="muted">{k}</div><strong style={{ fontSize: "1.5rem" }}>{v}</strong></div>)}
      </div>

      <section className="card">
        <h2>Week 1 submissions</h2>
        <div className="grid" style={{ gap: ".75rem" }}>
          {submissions.length ? submissions.map((s) => (
            <article key={s.id} className="card" style={{ padding: "1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:".75rem", flexWrap:"wrap" }}>
                <div><strong>{s.display_name}</strong> <span className="pill">{s.status}</span><div><a href={s.github_url} target="_blank" rel="noreferrer">{s.github_url}</a></div></div>
                <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
                  <button className="btn" onClick={()=>review(s.id,"approved")}>Approve</button>
                  <button className="btn" onClick={()=>review(s.id,"needs_revision")}>Needs revision</button>
                  <button className="btn" onClick={()=>review(s.id,"follow_up_requested")}>Request follow-up</button>
                </div>
              </div>
              <p className="muted" style={{ marginBottom: 0 }}><strong>Approach:</strong> {s.approach_note}</p>
            </article>
          )) : <p className="muted">No submissions yet.</p>}
        </div>
      </section>

      <section className="card">
        <h2>Late-access requests</h2>
        <div className="grid" style={{ gap: ".75rem" }}>
          {requests.length ? requests.map((r) => (
            <article key={r.id} className="card" style={{ padding: "1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:".75rem", flexWrap:"wrap" }}>
                <div><strong>{r.display_name}</strong> <span className="pill">{r.status}</span><div className="muted">{r.reason}</div></div>
                <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
                  <button className="btn" onClick={()=>decideLate(r.id,"granted")}>Grant access</button>
                  <button className="btn" onClick={()=>decideLate(r.id,"declined")}>Decline</button>
                </div>
              </div>
            </article>
          )) : <p className="muted">No late-access requests.</p>}
        </div>
      </section>

      <section className="card">
        <h2>Week 1 roll-call attendance</h2>
        <div className="grid" style={{ gap: ".5rem" }}>
          {attendance.map((a) => (
            <div key={a.user_id} className="card" style={{ padding: ".75rem", display:"flex", justifyContent:"space-between", gap:".75rem", alignItems:"center", flexWrap:"wrap" }}>
              <div><strong>{a.display_name}</strong> <span className="pill">{a.status}</span></div>
              <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
                {["present","absent","excused"].map((s)=><button key={s} className="btn" onClick={()=>setAttendanceStatus(a.user_id,s)}>{s}</button>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>5-pillar scoring</h2>
        <form onSubmit={saveScore} className="grid" style={{ gap: ".75rem" }}>
          <label className="grid" style={{ gap: ".35rem" }}><span>Mentee</span><select value={scoreUser} onChange={(e)=>setScoreUser(e.target.value)}>{overview?.mentees?.map((m)=><option key={m.id} value={m.id}>{m.display_name}</option>)}</select></label>
          <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:".75rem" }}>
            {[["projects","Projects 40%"],["understanding","Understanding 20%"],["discussion","Discussion 15%"],["weeklyTasks","Weekly Tasks 15%"],["collaboration","Collaboration 10%"]].map(([k,label])=>(
              <label key={k} className="grid" style={{ gap: ".35rem" }}><span>{label}</span><input type="number" min="0" max="100" value={scoreForm[k]} onChange={(e)=>setScoreForm({...scoreForm,[k]:Number(e.target.value)})} /></label>
            ))}
          </div>
          <label className="grid" style={{ gap: ".35rem" }}><span>Mentor summary</span><textarea rows={3} value={scoreForm.mentorSummary} onChange={(e)=>setScoreForm({...scoreForm,mentorSummary:e.target.value})} /></label>
          <div><button className="btn btn-primary">Save score</button></div>
        </form>
      </section>
      <section className="card"><h2>Week states</h2><div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>{weeks.map((w) => <div key={w.weekNumber} className="card" style={{ padding: ".75rem" }}><strong>Week {w.weekNumber}</strong><div className="muted" style={{ fontSize: ".85rem" }}>{w.state}</div></div>)}</div></section>
      <ClarificationDrawer open={clarifyOpen} onClose={() => setClarifyOpen(false)} weekNumber={1} topics={curriculum.weeks[0]?.outlineTopics || []} role="MENTOR" />
      <ProgramCharterDrawer open={charterOpen} onClose={() => setCharterOpen(false)} />
    </div></main>
  );
}
