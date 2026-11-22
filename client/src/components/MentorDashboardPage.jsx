import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function MentorDashboardPage() {
  const nav = useNavigate();
  const [session] = useState(() => { try { return JSON.parse(localStorage.getItem("dev8_session")); } catch { return null; } });
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    fetch(`${API}/api/weeks`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Failed"); setWeeks(d.weeks || []); })
      .catch((e) => setError(e.message));
  }, [session, nav]);

  return (
    <main className="section"><div className="container grid" style={{ gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div><span className="pill">Mentor Workspace</span><h1>Cohort overview</h1><p className="muted">Roll-call, reviews, late access, and scoring controls will land in Phase 5-6.</p></div>
        <div style={{ display: "flex", gap: ".5rem" }}><Link className="btn" to="/">Landing</Link><button className="btn" onClick={() => { localStorage.removeItem("dev8_session"); nav("/login"); }}>Sign out</button></div>
      </div>
      {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
        {["Submitted","Locked/Past Cutoff","Late Access","Follow-Ups","Open Clarifications"].map((k) => <div key={k} className="card"><div className="muted">{k}</div><strong style={{ fontSize: "1.5rem" }}>0</strong></div>)}
      </div>
      <section className="card"><h2>Week states</h2><div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>{weeks.map((w) => <div key={w.weekNumber} className="card" style={{ padding: ".75rem" }}><strong>Week {w.weekNumber}</strong><div className="muted" style={{ fontSize: ".85rem" }}>{w.state}</div></div>)}</div></section>
    </div></main>
  );
}
