import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import curriculum from "../data/curriculum.json";
import { formatWat } from "../utils/scheduleWat";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DashboardPage() {
  const nav = useNavigate();
  const [session] = useState(() => { try { return JSON.parse(localStorage.getItem("dev8_session")); } catch { return null; } });
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState("");
  const [now] = useState(() => formatWat(new Date()));

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    fetch(`${API}/api/weeks`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Failed"); setWeeks(d.weeks || []); })
      .catch((e) => setError(e.message));
  }, [session, nav]);

  const active = weeks.find((w) => ["active_open", "late_access_granted", "closed_cutoff"].includes(w.state)) || weeks[0];
  const outline = curriculum.weeks.find((w) => w.weekNumber === active?.weekNumber) || curriculum.weeks[0];

  return (
    <main className="section">
      <div className="container grid" style={{ gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div><span className="pill">Mentee Workspace</span><h1 style={{ marginBottom: 0 }}>Week {outline.weekNumber}: {outline.title}</h1><p className="muted">Current WAT: {now}</p></div>
          <div style={{ display: "flex", gap: ".5rem" }}><Link className="btn" to="/">Landing</Link><button className="btn" onClick={() => { localStorage.removeItem("dev8_session"); nav("/login"); }}>Sign out</button></div>
        </div>
        {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div><strong>Status:</strong> <span className="pill">{active?.state || "loading"}</span></div>
            <div className="muted">Due Sunday 11:59 PM WAT</div>
          </div>
          <h2>Topics to research</h2>
          <ul>{outline.outlineTopics.map((t) => <li key={t.id}><strong>{t.topic}</strong><div className="muted">Keywords: {t.researchKeywords.join(", ")}</div></li>)}</ul>
          <h2>Project brief</h2>
          <p><strong>{outline.projectBrief.title}</strong></p>
          <p className="muted">{outline.projectBrief.description}</p>
          <ul>{outline.projectBrief.acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
        <section className="card"><h2>8-week map</h2><div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>{(weeks.length ? weeks : curriculum.weeks.map(w=>({...w,state:"locked_schedule"}))).map((w) => <div key={w.weekNumber} className="card" style={{ padding: ".75rem" }}><strong>Week {w.weekNumber}</strong><div className="muted" style={{ fontSize: ".85rem" }}>{w.state || "locked_schedule"}</div></div>)}</div></section>
      </div>
    </main>
  );
}
