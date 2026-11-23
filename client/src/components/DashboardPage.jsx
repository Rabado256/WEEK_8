import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import curriculum from "../data/curriculum.json";
import { formatWat } from "../utils/scheduleWat";
import { api, getSession } from "../utils/api";
import ClarificationDrawer from "./ClarificationDrawer";

export default function DashboardPage() {
  const nav = useNavigate();
  const [session] = useState(getSession);
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [now] = useState(() => formatWat(new Date()));
  const [activeWeekNum, setActiveWeekNum] = useState(null);
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [lateAccess, setLateAccess] = useState(null);
  const [submitForm, setSubmitForm] = useState({ githubUrl: "", liveUrl: "", approachNote: "", aiReflectionNote: "" });
  const [lateForm, setLateForm] = useState({ reason: "", blockers: "", requestedUntilWat: "" });
  const [submitOpen, setSubmitOpen] = useState(false);
  const [lateOpen, setLateOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);

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

  const total = outline.outlineTopics.length;
  const done = completed.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const status = activeWeek?.state || "loading";
  const pastCutoff = status === "closed_cutoff";
  const canLateRequest = pastCutoff && lateAccess?.status !== "granted";

  return (
    <main className="ws-page">
      <div className="container ws-container">
        <section className="ws-hero">
          <div>
            <p className="ws-eyebrow"><span />Mentee workspace</p>
            <h1 className="ws-title">Week {outline.weekNumber}<span> · {outline.title}</span></h1>
            <p className="ws-sub">{now} WAT <span className="ws-sep">•</span> <span className="ws-status">{status.replace(/_/g, " ")}</span>{saving ? <span className="ws-save"> · {saving}</span> : null}</p>
          </div>
          <button className="btn ws-ghost" onClick={() => setClarifyOpen(true)}>Ask for clarification</button>
        </section>

        {error && <div className="d-alert">{error}</div>}

        <div className="ws-flow">
          <section className="ws-card">
            <header className="ws-card-head">
              <div className="ws-step"><span>01</span><div><p className="ws-kicker">Research</p><h2>Weekly checklist</h2></div></div>
              <div className="ws-meta">{done}/{total} complete</div>
            </header>
            <div className="ws-progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
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

          <section className="ws-card">
            <header className="ws-card-head">
              <div className="ws-step"><span>02</span><div><p className="ws-kicker">Reflect</p><h2>Personal notes</h2></div></div>
              <div className="ws-meta">{saving || "Autosaved"}</div>
            </header>
            <textarea className="ds-notes" aria-label="Personal notes" rows={9} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Capture what you learned, blockers, and decisions..." />
          </section>

          <section className="ws-card">
            <header className="ws-card-head">
              <div className="ws-step"><span>03</span><div><p className="ws-kicker">Build</p><h2>Project brief</h2></div></div>
              <span className={`ds-pill ${mySubmission ? "is-ok" : ""}`}>{mySubmission ? mySubmission.status : "Not submitted"}</span>
            </header>
            <h3 className="ds-brief-title">{outline.projectBrief.title}</h3>
            <p className="ds-muted">{outline.projectBrief.description}</p>
            <ul className="ds-list">{outline.projectBrief.acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
            <div className="ws-brief-footer">
              <p className="ds-muted ws-brief-note">{pastCutoff ? "WAT cutoff passed." : "Due Sunday 11:59 PM WAT."}{lateAccess ? ` Late access: ${lateAccess.status}.` : ""}</p>
              {canLateRequest ? (
                <button type="button" className="btn btn-primary ds-submit-btn" onClick={() => setLateOpen(true)}>Request late submission</button>
              ) : (
                <button type="button" className="btn btn-primary ds-submit-btn" onClick={() => setSubmitOpen(true)}>{mySubmission ? "Resubmit project" : "Submit project"}</button>
              )}
            </div>
          </section>
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
    </main>
  );
}
