const RULES = [
  ["1. Learn & Build", "Weekly topics + practical project. Watching is not enough."],
  ["2. Discussion & Participation", "Ask questions, explain your approach, and review peers respectfully."],
  ["3. AI / Vibe Coding", "AI is allowed, but you must understand, explain, modify, and debug what you ship."],
  ["4. Projects & Submissions", "Own work only. No copying peers. Submit a valid GitHub repository."],
  ["5. Deadlines & Commitment", "Sunday 11:59 PM WAT cutoff. Communicate early if blocked; mentors can grant late access."],
  ["6. Respect & Community", "No insults, mocking, or harassment. Help others grow."],
  ["7. Student Scoring", "Projects 40%, Code Quality 20%, Discussion 15%, Weekly Tasks 15%, Collaboration 10%."],
  ["8. Responsibility & Support", "Learners do independent work; mentors guide, clarify, and review."],
];

export default function ProgramCharterDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-label="Program Charter" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <span className="pill">Program Charter</span>
            <h2 style={{ margin: ".5rem 0 0" }}>Dev8 Rules & Culture</h2>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close charter">Close</button>
        </div>
        <p className="muted">Learn → Discuss → Build → Submit → Review → Improve → Ship</p>
        <div className="grid" style={{ gap: ".75rem" }}>
          {RULES.map(([title, body]) => (
            <article key={title} className="card" style={{ padding: "1rem" }}>
              <strong>{title}</strong>
              <div className="muted" style={{ marginTop: ".25rem" }}>{body}</div>
            </article>
          ))}
        </div>
        <div className="card" style={{ marginTop: "1rem" }}>
          <strong>Cadence & Scoring</strong>
          <p className="muted" style={{ marginBottom: 0 }}>Monday outline drop (WAT). Sunday 23:59:59 WAT submission cutoff. Weighted growth score: 0.40P + 0.20U + 0.15D + 0.15T + 0.10C.</p>
        </div>
      </aside>
      <style>{`
        .drawer-backdrop{position:fixed;inset:0;background:rgba(17,19,24,.35);display:flex;justify-content:flex-end;z-index:50}
        .drawer{width:min(560px,100vw);height:100%;overflow:auto;background:var(--bg);border-left:1px solid var(--border);padding:1.25rem}
        .drawer-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;position:sticky;top:0;background:var(--bg);padding-bottom:.75rem}
      `}</style>
    </div>
  );
}
