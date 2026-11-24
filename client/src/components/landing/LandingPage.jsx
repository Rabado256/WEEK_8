import { useState } from "react";
import { Link } from "react-router-dom";
import content from "../../data/landingContent.json";
import "../../styles/landing.css";

function readSession() {
  try { const raw = localStorage.getItem("dev8_session"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export default function LandingPage() {
  const [session] = useState(readSession);

  return (
    <>
      <main id="welcome" className="landing-main">
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
              <div className="hero-stat"><strong>Mentor</strong><span>Reviews</span></div>
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
                  <div className="output-line"><span className="out-ok">✓</span> cutoff <span className="out-dim">Sun 11:59 PM WAT</span></div>
                  <div className="output-line"><span className="out-ok">✓</span> repo shipped <span className="out-dim">github.com/you/week-03</span></div>
                  <div className="output-line"><span className="out-ok">!</span> missed cutoff? <span className="out-dim">submit reason → mentor review for access</span></div>
                  <div className="output-line"><span className="out-arrow">→</span> <span className="out-accent">reviewed, then next week unlocked</span></div>
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
              <h2>Students <span className="gradient-text">repos</span></h2>
            </div>
            <div className="proof-grid">
              {content.successStories.map((s, i) => (
                <article key={s.name} className="proof-card">
                  <div className="proof-browser">
                    <div className="browser-bar"><span /><span /><span /><div className="browser-url">{s.site}</div></div>
                    <div className="proof-shot">
                      <iframe
                        src={s.live}
                        title={`${s.name} live preview`}
                        loading="lazy"
                        className="proof-iframe"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      />
                      <a className="proof-shot-overlay" href={s.live} target="_blank" rel="noreferrer" aria-label={`Open ${s.name} live site`}>
                        <span>Open live ↗</span>
                      </a>
                    </div>
                  </div>
                  <div className="proof-body">
                    <div className="proof-top">
                      <span className="proof-id">REF 0{i + 1}</span>
                      <div className="proof-links">
                        <a className="proof-link" href={s.live} target="_blank" rel="noreferrer">Live ↗</a>
                        <a className="proof-link" href={s.link} target="_blank" rel="noreferrer">GitHub ↗</a>
                      </div>
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

    </>
  );
}
