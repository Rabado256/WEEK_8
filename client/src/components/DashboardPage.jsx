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
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div><strong>Status:</strong> <span className="pill">{weeks.find((w)=>w.weekNumber===activeWeekNum)?.state || "loading"}</span></div>
            <div className="muted">Due Sunday 11:59 PM WAT</div>
          </div>
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
      <WeekMapDrawer open={mapOpen} onClose={() => setMapOpen(false)} weeks={weeks.length ? weeks : curriculum.weeks.map(w=>({...w,state:"locked_schedule"}))} activeWeek={outline.weekNumber} />
    </main>
  );
}
