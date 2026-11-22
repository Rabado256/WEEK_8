import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import curriculum from "../data/curriculum.json";
import { formatWat } from "../utils/scheduleWat";
import { api, clearSession, getSession } from "../utils/api";
import WeekMapDrawer from "./WeekMapDrawer";
import ScratchpadPanel from "./ScratchpadPanel";

export default function DashboardPage() {
  const nav = useNavigate();
  const [session] = useState(getSession);
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [now] = useState(() => formatWat(new Date()));
  const [activeWeekNum, setActiveWeekNum] = useState(null);
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logForm, setLogForm] = useState({ title: "", url: "", takeaway: "" });
  const [mySubmission, setMySubmission] = useState(null);
  const [lateAccess, setLateAccess] = useState(null);
  const [submitForm, setSubmitForm] = useState({ githubUrl: "", liveUrl: "", approachNote: "", aiReflectionNote: "" });
  const [lateForm, setLateForm] = useState({ reason: "", blockers: "", requestedUntilWat: "" });
  const [submitOpen, setSubmitOpen] = useState(false);
  const [lateOpen, setLateOpen] = useState(false);

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    api("/api/weeks").then((d) => {
      const ws = d.weeks || [];
      setWeeks(ws);
      const active = ws.find((w) => ["active_open", "late_access_granted", "closed_cutoff"].includes(w.state)) || ws[0];
      if (active) setActiveWeekNum(active.weekNumber);
    }).catch((e) => setError(e.message));
  }, [session, nav]);

  const outline = useMemo(() => curriculum.weeks.find((w) => w.weekNumber === activeWeekNum) || curriculum.weeks[0], [activeWeekNum]);

  useEffect(() => {
    if (!activeWeekNum) return;
    let cancelled = false;
    const w = weeks.find((x) => x.weekNumber === activeWeekNum);
    Promise.resolve().then(() => {
      if (cancelled) return;
      setNotes(w?.progress?.personalNotes || "");
      setCompleted(w?.progress?.completedTopicIds || []);
    });
    api(`/api/weeks/${activeWeekNum}/research-logs`).then((d) => { if (!cancelled) setLogs(d.logs || []); }).catch(() => { if (!cancelled) setLogs([]); });
    api(`/api/weeks/${activeWeekNum}/submission/me`).then((d) => {
      if (cancelled) return;
      setMySubmission(d.submission || null);
      setLateAccess(d.lateAccess || null);
      if (d.submission) setSubmitForm({ githubUrl: d.submission.github_url || "", liveUrl: d.submission.live_url || "", approachNote: d.submission.approach_note || "", aiReflectionNote: d.submission.ai_reflection_note || "" });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeWeekNum, weeks]);

  useEffect(() => {
    if (!activeWeekNum) return;
    const t = setTimeout(async () => {
      try {
        setSaving("Saving...");
        await api(`/api/weeks/${activeWeekNum}/progress`, { method: "PATCH", body: { completedTopicIds: completed, personalNotes: notes } });
        setSaving("Saved");
      } catch (e) { setSaving(e.message); }
    }, 500);
    return () => clearTimeout(t);
  }, [notes, completed, activeWeekNum]);

  async function addLog(e) {
    e.preventDefault();
    if (!activeWeekNum || !logForm.title.trim() || !logForm.takeaway.trim()) return;
    try {
      await api(`/api/weeks/${activeWeekNum}/research-logs`, { method: "POST", body: logForm });
      setLogForm({ title: "", url: "", takeaway: "" });
      const d = await api(`/api/weeks/${activeWeekNum}/research-logs`);
      setLogs(d.logs || []);
    } catch (err) { setError(err.message); }
  }

  async function submitProject(e) {
    e.preventDefault();
    if (!activeWeekNum) return;
    try {
      await api(`/api/weeks/${activeWeekNum}/submit`, { method: "POST", body: submitForm });
      setSubmitOpen(false);
      const [w, s] = await Promise.all([api("/api/weeks"), api(`/api/weeks/${activeWeekNum}/submission/me`)]);
      setWeeks(w.weeks || []); setMySubmission(s.submission || null); setLateAccess(s.lateAccess || null);
    } catch (err) { setError(err.message); }
  }

  async function requestLateAccess(e) {
    e.preventDefault();
    if (!activeWeekNum) return;
    try {
      await api(`/api/weeks/${activeWeekNum}/late-access`, { method: "POST", body: lateForm });
      setLateOpen(false);
      const s = await api(`/api/weeks/${activeWeekNum}/submission/me`);
      setLateAccess(s.lateAccess || null);
    } catch (err) { setError(err.message); }
  }

  function toggleTopic(id) {
    setCompleted((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  return (
    <main className="section">
      <div className="container grid" style={{ gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div><span className="pill">Mentee Workspace</span><h1 style={{ marginBottom: 0 }}>Week {outline.weekNumber}: {outline.title}</h1><p className="muted">Current WAT: {now} · {saving}</p></div>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}><button className="btn" onClick={() => setMapOpen(true)}>Week Map</button><Link className="btn" to="/">Landing</Link><button className="btn" onClick={() => { clearSession(); nav("/login"); }}>Sign out</button></div>
        </div>
        {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}

        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div><strong>Status:</strong> <span className="pill">{weeks.find((w)=>w.weekNumber===activeWeekNum)?.state || "loading"}</span></div>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => setSubmitOpen(true)}>{mySubmission ? "Resubmit project" : "Submit project"}</button>
              <button className="btn" onClick={() => setLateOpen(true)}>Request late access</button>
            </div>
          </div>
          <p className="muted" style={{ marginTop: ".5rem" }}>Due Sunday 11:59 PM WAT. {mySubmission ? `Submission: ${mySubmission.status}` : "No submission yet."} {lateAccess ? `Late access: ${lateAccess.status}.` : ""}</p>
          <h2>Topics to research</h2>
          <div className="grid" style={{ gap: ".5rem" }}>
            {outline.outlineTopics.map((t) => (
              <label key={t.id} className="card" style={{ padding: ".75rem", display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
                <input type="checkbox" checked={completed.includes(t.id)} onChange={() => toggleTopic(t.id)} style={{ width: 18, height: 18, marginTop: 4 }} />
                <div><strong>{t.topic}</strong><div className="muted">Keywords: {t.researchKeywords.join(", ")}</div></div>
              </label>
            ))}
          </div>
          <h2 style={{ marginTop: "1.25rem" }}>Personal notes</h2>
          <textarea aria-label="Personal notes" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Capture what you're learning this week..." />
          <h2 style={{ marginTop: "1.25rem" }}>Project brief</h2>
          <p><strong>{outline.projectBrief.title}</strong></p>
          <p className="muted">{outline.projectBrief.description}</p>
          <ul>{outline.projectBrief.acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>

        <section className="card">
          <h2>What I Found & Learned</h2>
          <form onSubmit={addLog} className="grid" style={{ gap: ".75rem", marginBottom: "1rem" }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: ".75rem" }}>
              <label className="grid" style={{ gap: ".35rem" }}><span>Resource title</span><input value={logForm.title} onChange={(e) => setLogForm({ ...logForm, title: e.target.value })} required /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>URL (optional)</span><input value={logForm.url} onChange={(e) => setLogForm({ ...logForm, url: e.target.value })} placeholder="https://..." /></label>
            </div>
            <label className="grid" style={{ gap: ".35rem" }}><span>Takeaway</span><textarea rows={3} value={logForm.takeaway} onChange={(e) => setLogForm({ ...logForm, takeaway: e.target.value })} required /></label>
            <div><button className="btn btn-primary">Add research log</button></div>
          </form>
          <div className="grid" style={{ gap: ".75rem" }}>
            {logs.length ? logs.map((l) => <article key={l.id} className="card" style={{ padding: ".9rem" }}><strong>{l.title}</strong>{l.url && <div><a href={l.url} target="_blank" rel="noreferrer">Source</a></div>}<div className="muted">{l.takeaway}</div></article>) : <p className="muted">No research logs yet. Add what you discovered.</p>}
          </div>
        </section>

        <ScratchpadPanel weekNumber={outline.weekNumber} sandboxMode={outline.sandboxMode} />
      </div>
      {submitOpen && (
        <div className="drawer-backdrop" role="dialog" aria-modal="true" onClick={() => setSubmitOpen(false)}>
          <form className="drawer" onClick={(e) => e.stopPropagation()} onSubmit={submitProject}>
            <div className="drawer-head"><div><span className="pill">GitHub Submission</span><h2 style={{ margin: ".5rem 0 0" }}>Week {activeWeekNum} project</h2></div><button type="button" className="btn" onClick={() => setSubmitOpen(false)}>Close</button></div>
            <div className="grid" style={{ gap: ".75rem" }}>
              <label className="grid" style={{ gap: ".35rem" }}><span>GitHub repository URL</span><input required value={submitForm.githubUrl} onChange={(e)=>setSubmitForm({...submitForm,githubUrl:e.target.value})} placeholder="https://github.com/username/repo" /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Live demo URL (optional)</span><input value={submitForm.liveUrl} onChange={(e)=>setSubmitForm({...submitForm,liveUrl:e.target.value})} placeholder="https://..." /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Approach explanation</span><textarea required rows={4} value={submitForm.approachNote} onChange={(e)=>setSubmitForm({...submitForm,approachNote:e.target.value})} /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>AI / Vibe Coding reflection</span><textarea required rows={4} value={submitForm.aiReflectionNote} onChange={(e)=>setSubmitForm({...submitForm,aiReflectionNote:e.target.value})} /></label>
              <button className="btn btn-primary">Submit repository</button>
            </div>
          </form>
          <style>{`.drawer-backdrop{position:fixed;inset:0;background:rgba(17,19,24,.35);display:flex;justify-content:flex-end;z-index:50}.drawer{width:min(560px,100vw);height:100%;overflow:auto;background:var(--bg);border-left:1px solid var(--border);padding:1.25rem}.drawer-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;position:sticky;top:0;background:var(--bg);padding-bottom:.75rem}`}</style>
        </div>
      )}
      {lateOpen && (
        <div className="drawer-backdrop" role="dialog" aria-modal="true" onClick={() => setLateOpen(false)}>
          <form className="drawer" onClick={(e) => e.stopPropagation()} onSubmit={requestLateAccess}>
            <div className="drawer-head"><div><span className="pill">Late Access Request</span><h2 style={{ margin: ".5rem 0 0" }}>Week {activeWeekNum} cutoff</h2></div><button type="button" className="btn" onClick={() => setLateOpen(false)}>Close</button></div>
            <div className="grid" style={{ gap: ".75rem" }}>
              <label className="grid" style={{ gap: ".35rem" }}><span>Why submission was missed/delayed</span><textarea required rows={4} value={lateForm.reason} onChange={(e)=>setLateForm({...lateForm,reason:e.target.value})} /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Current blockers/progress</span><textarea rows={3} value={lateForm.blockers} onChange={(e)=>setLateForm({...lateForm,blockers:e.target.value})} /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Requested until (WAT ISO, optional)</span><input value={lateForm.requestedUntilWat} onChange={(e)=>setLateForm({...lateForm,requestedUntilWat:e.target.value})} placeholder="2026-11-25T23:59:59+01:00" /></label>
              <button className="btn btn-primary">Send request to mentor</button>
            </div>
          </form>
        </div>
      )}
      <WeekMapDrawer open={mapOpen} onClose={() => setMapOpen(false)} weeks={weeks.length ? weeks : curriculum.weeks.map(w=>({...w,state:"locked_schedule"}))} activeWeek={outline.weekNumber} />
    </main>
  );
}
