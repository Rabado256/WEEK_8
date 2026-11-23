import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api, getSession, setSession } from "../utils/api";

export default function AuthGatePage() {
  const existing = getSession();
  const loc = useLocation();
  const initialMode = loc.state?.mode === "login" ? "login" : "signup";
  const [mode, setMode] = useState(initialMode);
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
          <h1 className="auth-title">{mode === "signup" ? "Create your mentee account" : "Welcome back"}</h1>
          <p className="ds-muted">{mode === "signup" ? "New names create a mentee account. Use your cohort code and a 4+ digit PIN." : "Sign in with your cohort code, display name, and PIN."}</p>
          <div className="auth-mode" role="tablist" aria-label="Auth mode">
            <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>Sign up</button>
            <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>Login</button>
          </div>
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
            <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? "Please wait..." : mode === "signup" ? "Create account" : "Login"}</button>
          </form>
          <p className="auth-back"><Link to="/">← Back to home</Link></p>
        </div>
      </div>
    </main>
  );
}
