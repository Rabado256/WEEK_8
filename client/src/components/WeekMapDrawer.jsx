export default function WeekMapDrawer({ open, onClose, weeks, activeWeek }) {
  if (!open) return null;
  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-label="Week map" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div><span className="pill">8-Week Roadmap</span><h2 style={{ margin: ".5rem 0 0" }}>Your cohort timeline</h2></div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="grid" style={{ gap: ".75rem" }}>
          {weeks.map((w) => (
            <div key={w.weekNumber} className="card" style={{ padding: "1rem", borderColor: w.weekNumber === activeWeek ? "var(--accent)" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem" }}>
                <strong>Week {w.weekNumber}: {w.title}</strong>
                <span className="pill">{w.state || "locked_schedule"}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
      <style>{`.drawer-backdrop{position:fixed;inset:0;background:rgba(2,8,23,.55);backdrop-filter:blur(4px);display:flex;justify-content:flex-end;z-index:50}.drawer{width:min(560px,100vw);height:100%;overflow:auto;background:linear-gradient(180deg,#141d33,#0f1729);border-left:1px solid var(--border);padding:1.5rem;box-shadow:-20px 0 60px rgba(0,0,0,.4)}.drawer-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;position:sticky;top:0;background:linear-gradient(180deg,#141d33 60%,transparent);padding-bottom:1rem;z-index:1}`}</style>
    </div>
  );
}
