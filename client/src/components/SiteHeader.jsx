import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../utils/api";

export default function SiteHeader() {
  const nav = useNavigate();
  const loc = useLocation();
  const session = getSession();
  const authed = !!session?.token;

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link className="brand" to="/">Dev8</Link>
        <nav className="site-nav" aria-label="Primary">
          <Link to="/" className={loc.pathname === "/" ? "is-active" : ""}>Home</Link>
          <a href="/#mentorship">Mentorship</a>
          <a href="/#how-it-works">How It Works</a>
          <a href="/#why-us">Why Us</a>
          <a href="/#stories">Outcomes</a>
        </nav>
        <div className="site-header-actions">
          {authed ? (
            <>
              <span className="site-user">{session.user?.displayName}</span>
              <button className="btn site-btn" onClick={() => { clearSession(); nav("/login"); }}>Sign out</button>
            </>
          ) : (
            <Link className="btn btn-primary site-btn" to="/login">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
