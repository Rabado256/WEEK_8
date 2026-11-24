import { useState } from "react";
import { Link } from "react-router-dom";
import content from "../data/landingContent.json";
import ProgramCharterDrawer from "./ProgramCharterDrawer";

export default function SiteFooter() {
  const [charterOpen, setCharterOpen] = useState(false);

  return (
    <>
      <footer className="footer code-footer">
        <div className="container footer-main">
          <div className="footer-brand-col">
            <Link className="brand" to="/">Dev8</Link>
            <p className="footer-tagline"><span className="code-accent">//</span> mentorship that ships.</p>
            <p className="footer-meta">{content.footer.timezone}</p>
          </div>
          <div className="footer-col">
            <h4 className="footer-head"><span className="code-accent">01</span> Quick Links</h4>
            <ul className="footer-list">
              <li><a href="/#mentorship">Mentorship</a></li>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><a href="/#why-us">Why Us</a></li>
              <li><a href="/#stories">Outcomes</a></li>
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
            <h4 className="footer-head"><span className="code-accent">03</span> Cohort Notes</h4>
            <p className="footer-small">Key rules at a glance so every learner knows the rhythm.</p>
            <ul className="footer-list footer-notes">
              <li><span className="code-accent">TZ</span> WAT (Africa/Lagos, UTC+1)</li>
              <li><span className="code-accent">Due</span> Sunday 11:59 PM WAT</li>
              <li><span className="code-accent">Late</span> Submit reason for mentor review</li>
            </ul>
            <Link to="/login" className="text-link footer-workspace-link">Enter workspace →</Link>
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
