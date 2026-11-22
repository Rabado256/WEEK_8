import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, getSession, setSession } from "../utils/api";

export default function AuthGatePage() {
  const existing = getSession();
  const [form, setForm] = useState({ cohortCode: existing?.cohort?.code || "DEV8-2026", displayName: "", pin: "", role: "MENTEE" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await api("/api/auth/join", { method: "POST", body: form });
      setSession(data);
      nav(data.user.role === "MENTOR" ? "/mentor" : "/dashboard");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 560 }}>
        <p><Link to="/">← Back to Dev8</Link></p>
        <div className="card">
          <span className="pill">Cohort Workspace</span>
          <h1>Sign in</h1>
          <p className="muted">Use your cohort code, display name, and PIN. New names create a mentee session for the cohort.</p>
          <form onSubmit={submit} className="grid" style={{ marginTop: "1rem" }}>
            <label className="grid" style={{ gap: ".35rem" }}><span>Cohort code</span><input required value={form.cohortCode} onChange={(e) => set("cohortCode", e.target.value)} /></label>
            <label className="grid" style={{ gap: ".35rem" }}><span>Display name</span><input required value={form.displayName} onChange={(e) => set("displayName", e.target.value)} /></label>
            <label className="grid" style={{ gap: ".35rem" }}><span>PIN</span><input required type="password" inputMode="numeric" value={form.pin} onChange={(e) => set("pin", e.target.value)} /></label>
            <label className="grid" style={{ gap: ".35rem" }}><span>Role</span>
              <select value={form.role} onChange={(e) => set("role", e.target.value)}><option value="MENTEE">Mentee</option><option value="MENTOR">Mentor</option></select>
            </label>
            {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
            <button className="btn btn-primary" disabled={loading}>{loading ? "Signing in..." : "Enter workspace"}</button>
          </form>
        </div>
      </div>
      <style>{`input,select,textarea{width:100%;padding:.7rem .8rem;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);}`}</style>
    </main>
  );
}
