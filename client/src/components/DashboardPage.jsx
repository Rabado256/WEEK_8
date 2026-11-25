import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import curriculum from "../data/curriculum.json";
import { formatWat } from "../utils/scheduleWat";
import { api, getSession } from "../utils/api";
import ClarificationDrawer from "./ClarificationDrawer";

const STATUS_LABELS = {
  locked_schedule: "Locked",
  active_open: "Open",
  closed_cutoff: "Cutoff passed",
  late_access_granted: "Late access granted",
  unlocked: "Unlocked",
  loading: "Loading",
};

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
  const [lateForm, setLateForm] = useState({ reason: "", requestedUntilWat: "" });
  const [submitOpen, setSubmitOpen] = useState(false);
  const [lateOpen, setLateOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lateError, setLateError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestingLate, setRequestingLate] = useState(false);

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
    if (!activeWeekNum || submitting) return;
    setSubmitting(true); setSubmitError(""); setError("");
    try {
      await api(`/api/weeks/${activeWeekNum}/submit`, { method: "POST", body: submitForm });
      setSubmitOpen(false);
      const [w, s] = await Promise.all([api("/api/weeks"), api(`/api/weeks/${activeWeekNum}/submission/me`)]);
      setWeeks(w.weeks || []); setMySubmission(s.submission || null); setLateAccess(s.lateAccess || null);
    } catch (err) { setSubmitError(err.message); } finally { setSubmitting(false); }
  }

  async function requestLateAccess(e) {
    e.preventDefault();
    if (!activeWeekNum || requestingLate) return;
    setRequestingLate(true); setLateError(""); setError("");
    try {
      await api(`/api/weeks/${activeWeekNum}/late-access`, { method: "POST", body: lateForm });
      setLateOpen(false);
      const s = await api(`/api/weeks/${activeWeekNum}/submission/me`);
      setLateAccess(s.lateAccess || null);
    } catch (err) { setLateError(err.message); } finally { setRequestingLate(false); }
  }

  function toggleTopic(id) { setCompleted((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }

  const total = outline.outlineTopics.length;
  const done = completed.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const status = activeWeek?.state || "loading";
  const pastCutoff = status === "closed_cutoff";
  const canLateRequest = pastCutoff && lateAccess?.status !== "granted";
  const statusLabel = STATUS_LABELS[status] || status.replace(/_/g, " ");
  const submissionLabel = mySubmission ? mySubmission.status.replace(/_/g, " ") : "Not submitted";

  return (
    <main className="sd-page">
      <div className="container sd-wrap">
        <section className="sd-hero">
          <div className="sd-hero-main">
            <p className="ws-eyebrow"><span />Mentee workspace</p>
            <h1 className="sd-title">Week {outline.weekNumber}<span>{outline.title}</span></h1>
            <p className="sd-sub">Research the outline, capture your thinking, and ship before the WAT cutoff.</p>
            <div className="sd-meta-row">
              <span className="sd-chip"><span className="sd-dot" />{now} WAT</span>
              <span className={`sd-chip sd-chip-status is-${status}`}>{statusLabel}</span>
              {saving && <span className="sd-chip sd-chip-save">{saving}</span>}
            </div>
          </div>
          <div className="sd-hero-side">
            <div className="sd-progress-card">
              <div className="sd-ring" style={{ "--pct": pct }} aria-hidden="true"><div><strong>{pct}%</strong><span>done</span></div></div>
              <div className="sd-stats">
                <div className="sd-stat"><span>Checklist</span><strong>{done}/{total}</strong></div>
                <div className="sd-stat"><span>Submission</span><strong className={mySubmission ? "is-good" : ""}>{submissionLabel}</strong></div>
                <div className="sd-stat"><span>Late access</span><strong>{lateAccess?.status || "None"}</strong></div>
              </div>
            </div>
            <button className="btn sd-ghost" onClick={() => setClarifyOpen(true)}>Ask for clarification</button>
          </div>
        </section>

        {weeks.length > 0 && (
          <div className="sd-week-strip" aria-label="Weeks">
            {weeks.map((w) => (
              <button key={w.weekNumber} type="button" className={`sd-week-pill ${w.weekNumber === activeWeekNum ? "is-active" : ""}`} onClick={() => setActiveWeekNum(w.weekNumber)}>
                <span>Week {w.weekNumber}</span>
                <small>{(w.state || "locked").replace(/_/g, " ")}</small>
              </button>
            ))}
          </div>
        )}

        {error && <div className="d-alert">{error}</div>}

        <div className="sd-grid">
          <section className="sd-card">
            <header className="sd-card-head">
              <div className="sd-step"><span>01</span><div><p className="ws-kicker">Research</p><h2>Weekly checklist</h2></div></div>
              <div className="sd-head-meta">{done}/{total} complete</div>
            </header>
            <div className="ws-progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
            <div className="d-topic-list">
              {outline.outlineTopics.map((t, i) => (
                <label key={t.id} className={`d-topic ${completed.includes(t.id) ? "is-done" : ""}`}>
                  <input type="checkbox" checked={completed.includes(t.id)} onChange={() => toggleTopic(t.id)} />
                  <span className="d-check" aria-hidden="true" />
                  <div className="d-topic-body">
                    <div className="d-topic-top"><strong>{t.topic}</strong><span className="d-topic-num">0{i + 1}</span></div>
                    <div className="d-muted">{t.researchKeywords.join(" · ")}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="sd-card">
            <header className="sd-card-head">
              <div className="sd-step"><span>02</span><div><p className="ws-kicker">Reflect</p><h2>Personal notes</h2></div></div>
              <div className="sd-head-meta">{saving || "Autosaved"}</div>
            </header>
            <p className="sd-hint">Capture what you tried, what worked, what confused you, and what to ask next.</p>
            <textarea className="ds-notes sd-notes" aria-label="Personal notes" rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Capture what you learned, decisions, and questions for your mentor..." />
          </section>

          <section className="sd-card sd-card-build">
            <header className="sd-card-head">
              <div className="sd-step"><span>03</span><div><p className="ws-kicker">Build & Ship</p><h2>Project brief</h2></div></div>
              <span className={`ds-pill ${mySubmission ? "is-ok" : ""}`}>{submissionLabel}</span>
            </header>
            <div className="sd-brief">
              <div>
                <h3 className="ds-brief-title">{outline.projectBrief.title}</h3>
                <p className="ds-muted">{outline.projectBrief.description}</p>
                <ul className="ds-list">{outline.projectBrief.acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
              <div className="sd-brief-aside">
                <div className="sd-deadline">
                  <span className="sd-deadline-label">Deadline</span>
                  <strong>Sunday 11:59 PM</strong>
                  <span>WAT cutoff</span>
                </div>
                <div className="sd-brief-note">{pastCutoff ? "Cutoff passed. Request late access if needed." : "Submit before cutoff to stay on track."}{lateAccess ? ` Late access: ${lateAccess.status}.` : ""}</div>
                {canLateRequest ? (
                  <button type="button" className="btn btn-primary ds-submit-btn" onClick={() => { setLateError(""); setLateOpen(true); }}>Request late submission</button>
                ) : (
                  <button type="button" className="btn btn-primary ds-submit-btn" onClick={() => { setSubmitError(""); setSubmitOpen(true); }}>{mySubmission ? "Resubmit project" : "Submit project"}</button>
                )}
              </div>
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
              {submitError && <div className="d-alert">{submitError}</div>}
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit repository"}</button>
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

              <label className="grid" style={{ gap: ".35rem" }}><span>Requested until (WAT ISO, optional)</span><input value={lateForm.requestedUntilWat} onChange={(e)=>setLateForm({...lateForm,requestedUntilWat:e.target.value})} placeholder="2026-11-25T23:59:59+01:00" /></label>
              {lateError && <div className="d-alert">{lateError}</div>}
              <button className="btn btn-primary" type="submit" disabled={requestingLate}>{requestingLate ? "Sending..." : "Send request"}</button>
            </div>
          </form>
        </div>
      )}
      <ClarificationDrawer open={clarifyOpen} onClose={() => setClarifyOpen(false)} weekNumber={activeWeekNum} topics={outline.outlineTopics} role="MENTEE" />
    </main>
  );
}
