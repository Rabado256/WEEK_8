import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, clearSession, getSession } from "../utils/api";

export default function MentorDashboardPage() {
  const nav = useNavigate();
  const [session] = useState(getSession);
  const [weeks, setWeeks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token) { nav("/login"); return; }
    Promise.all([api("/api/weeks"), api("/api/mentor/overview?week=1")])
      .then(([w, o]) => { setWeeks(w.weeks || []); setOverview(o); })
      .catch((e) => setError(e.message));
  }, [session, nav]);

  return (
    <main className="section"><div className="container grid" style={{ gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div><span className="pill">Mentor Workspace</span><h1>Cohort overview</h1><p className="muted">Roll-call, reviews, late access, and scoring controls will land in Phase 5-6.</p></div>
        <div style={{ display: "flex", gap: ".5rem" }}><Link className="btn" to="/">Landing</Link><button className="btn" onClick={() => { clearSession(); nav("/login"); }}>Sign out</button></div>
      </div>
      {error && <div className="card" style={{ color: "var(--danger)" }}>{error}</div>}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
        {[
          ["Submitted", overview?.counts?.submitted ?? 0],
          ["Late Access", overview?.counts?.lateAccess ?? 0],
          ["Follow-Ups", overview?.counts?.followUps ?? 0],
          ["Open Clarifications", overview?.counts?.openClarifications ?? 0],
          ["Mentees", overview?.mentees?.length ?? 0],
        ].map(([k, v]) => <div key={k} className="card"><div className="muted">{k}</div><strong style={{ fontSize: "1.5rem" }}>{v}</strong></div>)}
      </div>
      <section className="card"><h2>Week states</h2><div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>{weeks.map((w) => <div key={w.weekNumber} className="card" style={{ padding: ".75rem" }}><strong>Week {w.weekNumber}</strong><div className="muted" style={{ fontSize: ".85rem" }}>{w.state}</div></div>)}</div></section>
    </div></main>
  );
}
