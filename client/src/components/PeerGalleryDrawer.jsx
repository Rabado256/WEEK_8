import { useEffect, useState } from "react";
import { api } from "../utils/api";

export default function PeerGalleryDrawer({ open, onClose, weekNumber }) {
  const [data, setData] = useState({ submissions: [], reviews: [] });
  const [error, setError] = useState("");

  async function load() {
    try {
      const d = await api(`/api/weeks/${weekNumber}/gallery`);
      setData({ submissions: d.submissions || [], reviews: d.reviews || [] });
      setError("");
    } catch (e) { setError(e.message); setData({ submissions: [], reviews: [] }); }
  }

  useEffect(() => { if (open) load(); }, [open, weekNumber]); // eslint-disable-line

  async function review(submissionId) {
    const strengthNote = window.prompt("What worked well?", "") || "";
    const suggestionNote = window.prompt("Constructive suggestion?", "") || "";
    if (!strengthNote || !suggestionNote) return;
    await api(`/api/submissions/${submissionId}/peer-review`, { method: "POST", body: { strengthNote, suggestionNote } }).catch((e)=>setError(e.message));
    load();
  }

  if (!open) return null;
  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <aside className="drawer" onClick={(e)=>e.stopPropagation()}>
        <div className="drawer-head"><div><span className="pill">Peer Gallery</span><h2 style={{margin:".5rem 0 0"}}>Week {weekNumber} submissions</h2></div><button className="btn" onClick={onClose}>Close</button></div>
        {error && <div className="card" style={{ color:"var(--danger)", marginBottom:"1rem" }}>{error}</div>}
        <div className="grid" style={{ gap: ".75rem" }}>
          {data.submissions.map((s) => (
            <article key={s.id} className="card" style={{ padding: "1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:".5rem", flexWrap:"wrap" }}><strong>{s.display_name}</strong><span className="pill">{s.status}</span></div>
              <div><a href={s.github_url} target="_blank" rel="noreferrer">{s.github_url}</a></div>
              {s.live_url && <div><a href={s.live_url} target="_blank" rel="noreferrer">Live demo</a></div>}
              <p className="muted">{s.approach_note}</p>
              <button className="btn" onClick={()=>review(s.id)}>Leave peer feedback</button>
              <div className="grid" style={{ gap: ".5rem", marginTop: ".75rem" }}>
                {data.reviews.filter(r=>r.submission_id===s.id).map((r)=><div key={r.id} className="card" style={{ padding: ".6rem" }}><strong>{r.reviewer_name}</strong><div className="muted">Worked well: {r.strength_note}</div><div className="muted">Suggestion: {r.suggestion_note}</div></div>)}
              </div>
            </article>
          ))}
          {!data.submissions.length && !error && <p className="muted">No submissions yet.</p>}
        </div>
      </aside>
      <style>{`.drawer-backdrop{position:fixed;inset:0;background:rgba(17,19,24,.35);display:flex;justify-content:flex-end;z-index:50}.drawer{width:min(680px,100vw);height:100%;overflow:auto;background:var(--bg);border-left:1px solid var(--border);padding:1.25rem}.drawer-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;position:sticky;top:0;background:var(--bg);padding-bottom:.75rem}`}</style>
    </div>
  );
}
