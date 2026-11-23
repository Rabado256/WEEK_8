import { useState } from "react";
import { Link } from "react-router-dom";
import content from "../data/landingContent.json";
import ProgramCharterDrawer from "./ProgramCharterDrawer";

export default function SiteFooter() {
  const [charterOpen, setCharterOpen] = useState(false);
  const [footerEmail, setFooterEmail] = useState("");

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
