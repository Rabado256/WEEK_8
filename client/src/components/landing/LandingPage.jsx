import { useState } from "react";
import { Link } from "react-router-dom";
import content from "../../data/landingContent.json";
import ProgramCharterDrawer from "../ProgramCharterDrawer";
import "../../styles/landing.css";

function readSession() {
  try { const raw = localStorage.getItem("dev8_session"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export default function LandingPage() {
  const [session] = useState(readSession);
  const [charterOpen, setCharterOpen] = useState(false);

  return (
    <>
      <nav className="landing-nav">
        <div className="container inner">
          <a className="brand" href="#welcome">Dev8</a>
          <div className="nav-links">
            <a href="#mentorship">Mentorship</a><a href="#how-it-works">How It Works</a><a href="#why-us">Why Us</a><a href="#stories">Success Stories</a>
          </div>
          <div className="nav-actions">
            <button className="btn" onClick={() => setCharterOpen(true)}>Program Rules</button>
            <Link className="btn btn-primary" to="/login">Cohort Sign-In</Link>
          </div>
        </div>
      </nav>

      <main id="welcome">
        <section className="hero container">
          {session?.user && (
            <div className="banner">
              <span>Welcome back, {session.user.displayName} — Jump to Week workspace →</span>
              <Link className="btn" to={session.user.role === "MENTOR" ? "/mentor" : "/dashboard"}>Continue →</Link>
            </div>
          )}
          <span className="pill">{content.hero.eyebrow}</span>
          <h1>{content.hero.headline}</h1>
          <p>{content.hero.subheadline}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/login">{content.hero.primaryCta}</Link>
            <a className="btn" href="#how-it-works">{content.hero.secondaryCta}</a>
          </div>
        </section>

        <section id="mentorship" className="section">
          <div className="container split">
            <div>
              <span className="pill">Introduce the Mentorship</span>
              <h2>{content.mentorship.title}</h2>
              <p className="muted">{content.mentorship.body}</p>
              <div className="loop">{content.mentorship.loop.map((s) => <span key={s} className="pill">{s}</span>)}</div>
            </div>
            <div className="card">
              <h3>Program culture</h3>
              <p className="muted">Watching is not enough. You have to build. Every week ends with a real GitHub submission, mentor review, and improvement loop.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section">
          <div className="container">
            <span className="pill">How It Works</span>
            <h2>The weekly Mon–Sun WAT rhythm</h2>
            <div className="grid steps">
              {content.howItWorks.map((step, i) => (
                <article key={step.title} className="card">
                  <div className="step-num">Step {i + 1}</div>
                  <h3>{step.title}</h3>
                  <p className="muted">{step.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="why-us" className="section">
          <div className="container">
            <span className="pill">Why Us</span>
            <h2>Standards that build real developers</h2>
            <div className="grid pillars">
              {content.whyUs.map((p) => <article key={p.title} className="card"><h3>{p.title}</h3><p className="muted">{p.detail}</p></article>)}
            </div>
            <div style={{ marginTop: "1rem" }}>
              <button className="btn" onClick={() => setCharterOpen(true)}>Read full Program Charter</button>
            </div>
          </div>
        </section>

        <section id="stories" className="section">
          <div className="container">
            <span className="pill">Success Stories</span>
            <h2>Cohort outcomes</h2>
            <div className="grid stories">
              {content.successStories.map((s) => (
                <article key={s.name} className="card">
                  <h3>{s.name}</h3>
                  <p className="muted">{s.outcome}</p>
                  <a className="btn" href={s.link} target="_blank" rel="noreferrer">View GitHub</a>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand">Dev8</div>
            <p>{content.footer.timezone} · {content.footer.note}</p>
          </div>
          <div className="footer-links">
            <a href="#mentorship">Mentorship</a><a href="#how-it-works">How It Works</a><a href="#why-us">Why Us</a><a href="#stories">Stories</a><button className="btn" style={{ padding: ".35rem .6rem" }} onClick={() => setCharterOpen(true)}>Program Rules</button><Link to="/login">Cohort Sign-In</Link>
          </div>
        </div>
      </footer>
      <ProgramCharterDrawer open={charterOpen} onClose={() => setCharterOpen(false)} />
    </>
  );
}
