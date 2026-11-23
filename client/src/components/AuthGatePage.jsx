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
    <main className="ws-page">
      <div className="container auth-wrap">
        <div className="ws-card auth-card">
          <p className="ws-eyebrow"><span />Cohort access</p>
          <h1 className="auth-title">Sign in to your workspace</h1>
          <p className="ds-muted">Use your cohort code, display name, and PIN. New names create a mentee account.</p>
          <form onSubmit={submit} className="auth-form">
            <label className="auth-field"><span>Cohort code</span><input required value={form.cohortCode} onChange={(e) => set("cohortCode", e.target.value)} /></label>
            <label className="auth-field"><span>Display name</span><input required value={form.displayName} onChange={(e) => set("displayName", e.target.value)} /></label>
            <div className="auth-row">
              <label className="auth-field"><span>PIN</span><input required type="password" inputMode="numeric" value={form.pin} onChange={(e) => set("pin", e.target.value)} /></label>
              <label className="auth-field"><span>Role</span>
                <select value={form.role} onChange={(e) => set("role", e.target.value)}><option value="MENTEE">Mentee</option><option value="MENTOR">Mentor</option></select>
              </label>
            </div>
            {error && <div className="d-alert">{error}</div>}
            <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? "Signing in..." : "Enter workspace"}</button>
          </form>
          <p className="auth-back"><Link to="/">← Back to home</Link></p>
        </div>
      </div>
    </main>
  );
}
