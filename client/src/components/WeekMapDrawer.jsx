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
      <style>{`.drawer-backdrop{position:fixed;inset:0;background:rgba(17,19,24,.35);display:flex;justify-content:flex-end;z-index:50}.drawer{width:min(560px,100vw);height:100%;overflow:auto;background:var(--bg);border-left:1px solid var(--border);padding:1.25rem}.drawer-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;position:sticky;top:0;background:var(--bg);padding-bottom:.75rem}`}</style>
    </div>
  );
}
