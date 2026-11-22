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
  const [footerEmail, setFooterEmail] = useState("");

  return (
    <>
      <nav className="landing-nav">
        <div className="container inner">
          <a className="brand" href="#welcome">Dev8</a>
          <div className="nav-links">
            <a href="#mentorship">Mentorship</a><a href="#how-it-works">How It Works</a><a href="#why-us">Why Us</a><a href="#stories">Success Stories</a>
          </div>
          <div className="nav-actions">
            <Link className="btn btn-primary" to="/login">Cohort Sign-In</Link>
          </div>
        </div>
      </nav>

      <main id="welcome">
        <section className="hero container hero-grid">
          <div className="hero-copy">
            {session?.user && (
              <div className="banner">
                <span>Welcome back, <strong>{session.user.displayName}</strong>.</span>
                <Link className="btn btn-primary" to={session.user.role === "MENTOR" ? "/mentor" : "/dashboard"}>Continue →</Link>
              </div>
            )}
            <span className="pill">{content.hero.eyebrow}</span>
            <h1>Build real skills. <em>Ship real work.</em></h1>
            <p>{content.hero.subheadline}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/login">{content.hero.primaryCta}</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><strong>8</strong><span>Weeks</span></div>
              <div className="hero-stat"><strong>1:1</strong><span>Feedback</span></div>
              <div className="hero-stat"><strong>WAT</strong><span>Cadence</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/images/hero-dev.svg" alt="Dev8 workspace preview showing code, mentor review, and scorecard" width="960" height="720" loading="eager" />
          </div>
        </section>
        <hr className="glow-line" />

        <section id="mentorship" className="section">
          <div className="container split mentorship-split">
            <div className="mentorship-copy">
              <div className="section-head">
                <span className="pill">Mentorship</span>
                <h2>{content.mentorship.title}</h2>
                <p>{content.mentorship.body}</p>
              </div>
              <div className="mentorship-note">
                <span className="note-dot" />
                <p><strong>Build, don't just watch.</strong> Ship weekly. Get reviewed. Improve fast.</p>
              </div>
            </div>
            <div className="mentorship-visual">
              <img src="/images/mentorship.jpg" alt="Mentor and developers collaborating on a project" loading="lazy" />
              <div className="mentorship-float">
                <span className="float-label">Live review</span>
                <strong>Feedback that moves you forward</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section">
          <div className="container">
            <div className="section-head center">
              <span className="pill">How It Works</span>
              <h2>Your weekly <span className="gradient-text">dev cycle</span></h2>
            </div>
            <div className="code-window">
              <div className="code-bar">
                <div className="code-dots"><span /><span /><span /></div>
                <div className="code-title">dev8-weekly-cycle.js</div>
                <div className="code-badge">WAT</div>
              </div>
              <div className="code-body">
                <div className="code-line"><span className="ln">1</span><span><span className="kw">async function</span> <span className="fn">runWeek</span><span className="muted-code">()</span> {"{"}</span></div>
                {content.howItWorks.map((step, i) => {
                  const cmds = ["getBrief", "buildAndAsk", "shipRepo", "reviewAndUnlock"];
                  return (
                    <div className="code-line step-line" key={step.title}>
                      <span className="ln">{i + 2}</span>
                      <span className="code-indent"><span className="kw">await</span> <span className="fn">{cmds[i]}</span><span className="muted-code">();</span> <span className="code-comment">// {step.detail}</span></span>
                    </div>
                  );
                })}
                <div className="code-line"><span className="ln">6</span><span><span className="kw">return</span> <span className="str">"next week unlocked"</span>;</span></div>
                <div className="code-line"><span className="ln">7</span><span>{"}"}</span></div>
                <div className="code-output">
                  <div className="output-head"><span className="output-dot" /> Output</div>
                  <div className="output-line"><span className="out-ok">✓</span> brief received <span className="out-dim">Mon 09:00 WAT</span></div>
                  <div className="output-line"><span className="out-ok">✓</span> repo shipped <span className="out-dim">github.com/you/week-03</span></div>
                  <div className="output-line"><span className="out-ok">✓</span> mentor review: <span className="out-accent">approved</span></div>
                  <div className="output-line"><span className="out-arrow">→</span> <span className="out-accent">next week unlocked</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why-us" className="section">
          <div className="container">
            <div className="section-head center">
              <span className="pill">Why Us</span>
              <h2>Built for <span className="gradient-text">real growth</span></h2>
            </div>
            <div className="why-list">
              {content.whyUs.map((p, i) => (
                <div key={p.title} className="why-row">
                  <div className="why-index"><span>0{i + 1}</span></div>
                  <div className="why-content">
                    <h3>{p.title}</h3>
                    <p>{p.detail}</p>
                  </div>
                  <div className="why-mark" aria-hidden="true">↗</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="stories" className="section">
          <div className="container">
            <div className="section-head center">
              <span className="pill">Outcomes</span>
              <h2>Proof of <span className="gradient-text">work</span></h2>
            </div>
            <div className="proof-grid">
              {content.successStories.map((s, i) => (
                <article key={s.name} className="proof-card">
                  <div className="proof-browser">
                    <div className="browser-bar"><span /><span /><span /><div className="browser-url">{s.site}</div></div>
                    <div className="proof-shot">
                      <img src={s.image} alt={`${s.name} preview`} loading="lazy" />
                    </div>
                  </div>
                  <div className="proof-body">
                    <div className="proof-top">
                      <span className="proof-id">REF 0{i + 1}</span>
                      <a className="proof-link" href={s.link} target="_blank" rel="noreferrer">GitHub ↗</a>
                    </div>
                    <h3>{s.name}</h3>
                    <p>{s.outcome}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer code-footer">
        <div className="container footer-main">
          <div className="footer-brand-col">
            <a className="brand" href="#welcome">Dev8</a>
            <p className="footer-tagline"><span className="code-accent">//</span> mentorship that ships.</p>
            <p className="footer-meta">{content.footer.timezone}</p>
          </div>
          <div className="footer-col">
            <h4 className="footer-head"><span className="code-accent">01</span> Quick Links</h4>
            <ul className="footer-list">
              <li><a href="#mentorship">Mentorship</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#why-us">Why Us</a></li>
              <li><a href="#stories">Outcomes</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-head"><span className="code-accent">02</span> Resources</h4>
            <ul className="footer-list">
              <li><button type="button" className="footer-link-btn" onClick={() => setCharterOpen(true)}>Program Rules</button></li>
              <li><Link to="/login">Cohort Sign-In</Link></li>
              <li><a href="https://github.com/topics/dev8" target="_blank" rel="noreferrer">GitHub</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-head"><span className="code-accent">03</span> Newsletter</h4>
            <p className="footer-small">Get cohort updates and shipping tips.</p>
            <div className="footer-form">
              <input type="email" placeholder="you@example.dev" value={footerEmail} onChange={(e) => setFooterEmail(e.target.value)} aria-label="Email address" />
              <button type="button" className="btn btn-primary footer-join">Join</button>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <p><span className="code-accent">©</span> 2026 Dev8. <span className="muted-code">Built for focus. Built for low bandwidth.</span></p>
          <p className="footer-bottom-code"><span className="muted-code">git commit -m</span> <span className="str">"keep shipping"</span></p>
        </div>
      </footer>
      <ProgramCharterDrawer open={charterOpen} onClose={() => setCharterOpen(false)} />
    </>
  );
}
