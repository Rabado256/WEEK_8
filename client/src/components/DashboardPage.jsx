import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import curriculum from "../data/curriculum.json";
import { formatWat } from "../utils/scheduleWat";
import { api, clearSession, getSession } from "../utils/api";
import WeekMapDrawer from "./WeekMapDrawer";
import ScratchpadPanel from "./ScratchpadPanel";
import ClarificationDrawer from "./ClarificationDrawer";
import PeerGalleryDrawer from "./PeerGalleryDrawer";
import ProgramCharterDrawer from "./ProgramCharterDrawer";
import { buildWeekNotesMarkdown, downloadMarkdown } from "../utils/exportMarkdown";

function Stat({ label, value, hint }) {
  return <div className="d-stat"><span className="d-stat-label">{label}</span><strong className="d-stat-value">{value}</strong>{hint && <span className="d-stat-hint">{hint}</span>}</div>;
}

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
  const [scorecard, setScorecard] = useState(null);
  const [lateAccess, setLateAccess] = useState(null);
  const [submitForm, setSubmitForm] = useState({ githubUrl: "", liveUrl: "", approachNote: "", aiReflectionNote: "" });
  const [lateForm, setLateForm] = useState({ reason: "", blockers: "", requestedUntilWat: "" });
  const [submitOpen, setSubmitOpen] = useState(false);
  const [lateOpen, setLateOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [charterOpen, setCharterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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
  const activeWeek = useMemo(() => weeks.find((w) => w.weekNumber === activeWeekNum), [weeks, activeWeekNum]);

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
    api("/api/scores/me").then((d) => { if (!cancelled) setScorecard(d); }).catch(() => {});
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

  function toggleTopic(id) { setCompleted((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }
  async function exportNotes() {
    try { setExporting(true); const data = await api("/api/export/me"); downloadMarkdown("dev8-week-notes.md", buildWeekNotesMarkdown(data)); }
    catch (e) { setError(e.message); } finally { setExporting(false); }
  }

  const done = completed.length;
  const total = outline.outlineTopics.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const status = activeWeek?.state || "loading";

  return (
    <main className="d-shell">
      <div className="d-wrap">
        <header className="d-topbar">
          <div>
            <div className="d-kicker"><span className="d-dot" />Mentee workspace</div>
            <h1 className="d-title">Week {outline.weekNumber} <span className="d-title-muted">/ {outline.title}</span></h1>
            <p className="d-meta">{now} WAT {saving && <span className="d-save">· {saving}</span>}</p>
          </div>
          <div className="d-actions">
            <button className="btn" onClick={() => setMapOpen(true)}>Week map</button>
            <button className="btn" onClick={() => setClarifyOpen(true)}>Clarify</button>
            <button className="btn" onClick={() => setGalleryOpen(true)}>Gallery</button>
            <button className="btn btn-primary" onClick={() => setSubmitOpen(true)}>{mySubmission ? "Resubmit" : "Submit project"}</button>
            <details className="d-more">
              <summary className="btn">More</summary>
              <div className="d-more-menu card">
                <button onClick={exportNotes} disabled={exporting}>{exporting ? "Exporting..." : "Export .md"}</button>
                <button onClick={() => setCharterOpen(true)}>Charter</button>
                <button onClick={() => setLateOpen(true)}>Request late access</button>
                <Link to="/">Landing</Link>
                <button onClick={() => { clearSession(); nav("/login"); }} className="d-danger">Sign out</button>
              </div>
            </details>
          </div>
        </header>

        {error && <div className="d-alert">{error}</div>}

        <section className="d-stats">
          <Stat label="Status" value={<span className="pill">{status}</span>} hint={mySubmission ? `Submission: ${mySubmission.status}` : "No submission yet"} />
          <Stat label="Progress" value={`${pct}%`} hint={`${done}/${total} topics checked`} />
          <Stat label="Research logs" value={logs.length} hint="What you found & learned" />
          <Stat label="Score" value={scorecard?.score?.weightedTotal ?? "—"} hint={scorecard?.score ? "Weighted 5-pillar" : "Awaiting review"} />
        </section>

        <div className="d-main">
          <div className="d-col">
            <section className="d-panel">
              <div className="d-panel-head"><h2>Research checklist</h2><span className="d-muted">{done}/{total}</span></div>
              <div className="d-progress"><div style={{ width: `${pct}%` }} /></div>
              <div className="d-topic-list">
                {outline.outlineTopics.map((t) => (
                  <label key={t.id} className={`d-topic ${completed.includes(t.id) ? "is-done" : ""}`}>
                    <input type="checkbox" checked={completed.includes(t.id)} onChange={() => toggleTopic(t.id)} />
                    <span className="d-check" aria-hidden="true" />
                    <div><strong>{t.topic}</strong><div className="d-muted">{t.researchKeywords.join(" · ")}</div></div>
                  </label>
                ))}
              </div>
            </section>

            <section className="d-panel">
              <div className="d-panel-head"><h2>Project brief</h2><span className="pill">{outline.sandboxMode === "built-in" ? "Scratchpad" : "Cloud"}</span></div>
              <p className="d-brief-title">{outline.projectBrief.title}</p>
              <p className="d-muted">{outline.projectBrief.description}</p>
              <ul className="d-criteria">{outline.projectBrief.acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>

            <ScratchpadPanel weekNumber={outline.weekNumber} sandboxMode={outline.sandboxMode} />

            <section className="d-panel">
              <div className="d-panel-head"><h2>Research log</h2><span className="d-muted">Evidence of learning</span></div>
              <form onSubmit={addLog} className="d-log-form">
                <input value={logForm.title} onChange={(e) => setLogForm({ ...logForm, title: e.target.value })} placeholder="Resource title" required />
                <input value={logForm.url} onChange={(e) => setLogForm({ ...logForm, url: e.target.value })} placeholder="URL (optional)" />
                <textarea rows={2} value={logForm.takeaway} onChange={(e) => setLogForm({ ...logForm, takeaway: e.target.value })} placeholder="Key takeaway..." required />
                <div><button className="btn btn-primary">Add log</button></div>
              </form>
              <div className="d-log-list">
                {logs.length ? logs.map((l) => (
                  <article key={l.id} className="d-log-item">
                    <div className="d-log-top"><strong>{l.title}</strong>{l.url && <a href={l.url} target="_blank" rel="noreferrer">source ↗</a>}</div>
                    <p className="d-muted">{l.takeaway}</p>
                  </article>
                )) : <p className="d-muted">No logs yet. Capture what you learned.</p>}
              </div>
            </section>
          </div>

          <aside className="d-col d-side">
            <section className="d-panel">
              <div className="d-panel-head"><h2>Submission</h2><span className={`d-status-dot ${mySubmission ? "ok" : ""}`} /></div>
              <p className="d-muted" style={{ marginTop: 0 }}>{mySubmission ? `Status: ${mySubmission.status}` : "Nothing submitted yet."}</p>
              {lateAccess && <p className="d-muted">Late access: {lateAccess.status}</p>}
              <div className="d-stack">
                <button className="btn btn-primary" onClick={() => setSubmitOpen(true)}>{mySubmission ? "Resubmit project" : "Submit project"}</button>
                <button className="btn" onClick={() => setLateOpen(true)}>Request late access</button>
              </div>
              <p className="d-muted d-small">Due Sunday 11:59 PM WAT.</p>
            </section>

            <section className="d-panel">
              <div className="d-panel-head"><h2>Notes</h2><span className="d-muted">{saving || "Autosave"}</span></div>
              <textarea aria-label="Personal notes" rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quick notes, blockers, ideas..." />
            </section>

            <section className="d-panel">
              <div className="d-panel-head"><h2>Scorecard</h2></div>
              {scorecard?.score ? (
                <div className="d-score-grid">
                  {[["Projects", scorecard.score.projects],["Understanding", scorecard.score.understanding],["Discussion", scorecard.score.discussion],["Tasks", scorecard.score.weeklyTasks],["Collab", scorecard.score.collaboration]].map(([k, v]) => (
                    <div key={k} className="d-score-item"><span>{k}</span><strong>{v}</strong></div>
                  ))}
                  <div className="d-score-item d-score-total"><span>Weighted</span><strong>{scorecard.score.weightedTotal}</strong></div>
                </div>
              ) : <p className="d-muted">Available after mentor review.</p>}
            </section>
          </aside>
        </div>
      </div>

      {submitOpen && (
        <div className="drawer-backdrop" role="dialog" aria-modal="true" onClick={() => setSubmitOpen(false)}>
          <form className="drawer" onClick={(e) => e.stopPropagation()} onSubmit={submitProject}>
            <div className="drawer-head"><div><span className="pill">Submit</span><h2 style={{ margin: ".5rem 0 0" }}>Week {activeWeekNum} project</h2></div><button type="button" className="btn" onClick={() => setSubmitOpen(false)}>Close</button></div>
            <div className="grid" style={{ gap: ".75rem" }}>
              <label className="grid" style={{ gap: ".35rem" }}><span>GitHub repository URL</span><input required value={submitForm.githubUrl} onChange={(e)=>setSubmitForm({...submitForm,githubUrl:e.target.value})} placeholder="https://github.com/username/repo" /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Live demo URL (optional)</span><input value={submitForm.liveUrl} onChange={(e)=>setSubmitForm({...submitForm,liveUrl:e.target.value})} placeholder="https://..." /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Approach</span><textarea required rows={4} value={submitForm.approachNote} onChange={(e)=>setSubmitForm({...submitForm,approachNote:e.target.value})} /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>AI reflection</span><textarea required rows={4} value={submitForm.aiReflectionNote} onChange={(e)=>setSubmitForm({...submitForm,aiReflectionNote:e.target.value})} /></label>
              <button className="btn btn-primary">Submit repository</button>
            </div>
          </form>
          <style>{`.drawer-backdrop{position:fixed;inset:0;background:rgba(2,8,23,.55);backdrop-filter:blur(4px);display:flex;justify-content:flex-end;z-index:50}.drawer{width:min(560px,100vw);height:100%;overflow:auto;background:linear-gradient(180deg,#141d33,#0f1729);border-left:1px solid var(--border);padding:1.5rem;box-shadow:-20px 0 60px rgba(0,0,0,.4)}.drawer-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;position:sticky;top:0;background:linear-gradient(180deg,#141d33 60%,transparent);padding-bottom:1rem;z-index:1}`}</style>
        </div>
      )}
      {lateOpen && (
        <div className="drawer-backdrop" role="dialog" aria-modal="true" onClick={() => setLateOpen(false)}>
          <form className="drawer" onClick={(e) => e.stopPropagation()} onSubmit={requestLateAccess}>
            <div className="drawer-head"><div><span className="pill">Late access</span><h2 style={{ margin: ".5rem 0 0" }}>Week {activeWeekNum}</h2></div><button type="button" className="btn" onClick={() => setLateOpen(false)}>Close</button></div>
            <div className="grid" style={{ gap: ".75rem" }}>
              <label className="grid" style={{ gap: ".35rem" }}><span>Reason</span><textarea required rows={4} value={lateForm.reason} onChange={(e)=>setLateForm({...lateForm,reason:e.target.value})} /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Blockers/progress</span><textarea rows={3} value={lateForm.blockers} onChange={(e)=>setLateForm({...lateForm,blockers:e.target.value})} /></label>
              <label className="grid" style={{ gap: ".35rem" }}><span>Requested until (WAT ISO, optional)</span><input value={lateForm.requestedUntilWat} onChange={(e)=>setLateForm({...lateForm,requestedUntilWat:e.target.value})} placeholder="2026-11-25T23:59:59+01:00" /></label>
              <button className="btn btn-primary">Send request</button>
            </div>
          </form>
        </div>
      )}
      <ClarificationDrawer open={clarifyOpen} onClose={() => setClarifyOpen(false)} weekNumber={activeWeekNum} topics={outline.outlineTopics} role="MENTEE" />
      <PeerGalleryDrawer open={galleryOpen} onClose={() => setGalleryOpen(false)} weekNumber={activeWeekNum} />
      <ProgramCharterDrawer open={charterOpen} onClose={() => setCharterOpen(false)} />
      <WeekMapDrawer open={mapOpen} onClose={() => setMapOpen(false)} weeks={weeks.length ? weeks : curriculum.weeks.map(w=>({...w,state:"locked_schedule"}))} activeWeek={outline.weekNumber} />
    </main>
  );
}
