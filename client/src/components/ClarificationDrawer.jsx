import { useEffect, useState } from "react";
import { api } from "../utils/api";

export default function ClarificationDrawer({ open, onClose, weekNumber, topics, role = "MENTEE" }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ topicId: topics[0]?.id || "", whatITried: "", question: "", codeSnippet: "" });
  const [error, setError] = useState("");

  async function load() {
    if (!weekNumber) return;
    const d = await api(`/api/weeks/${weekNumber}/clarifications`);
    setItems(d.clarifications || []);
  }

  useEffect(() => { if (open) load().catch((e)=>setError(e.message)); }, [open, weekNumber]); // eslint-disable-line

  async function submit(e) {
    e.preventDefault();
    try {
      await api(`/api/weeks/${weekNumber}/clarifications`, { method: "POST", body: form });
      setForm({ topicId: topics[0]?.id || "", whatITried: "", question: "", codeSnippet: "" });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function learnerReply(id, status) {
    const learnerNote = status === "resolved" ? "" : window.prompt("Add follow-up context:", "") || "";
    await api(`/api/clarifications/${id}/learner-reply`, { method: "PATCH", body: { status, learnerNote } }).catch((e)=>setError(e.message));
    load();
  }

  async function mentorRespond(id, status) {
    const mentorReply = window.prompt("Mentor reply:", "") || "";
    await api(`/api/clarifications/${id}/respond`, { method: "PATCH", body: { status, mentorReply, isPinnedFaq: false } }).catch((e)=>setError(e.message));
    load();
  }

  if (!open) return null;
  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <aside className="drawer" onClick={(e)=>e.stopPropagation()}>
        <div className="drawer-head"><div><span className="pill">Clarifications</span><h2 style={{margin:".5rem 0 0"}}>Need Additional Explanation</h2></div><button className="btn" onClick={onClose}>Close</button></div>
        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
        {role === "MENTEE" && (
          <form onSubmit={submit} className="grid" style={{ gap: ".75rem", marginBottom: "1rem" }}>
            <label className="grid" style={{ gap: ".35rem" }}><span>Topic</span><select value={form.topicId} onChange={(e)=>setForm({...form,topicId:e.target.value})}>{topics.map(t=><option key={t.id} value={t.id}>{t.topic}</option>)}</select></label>
            <label className="grid" style={{ gap: ".35rem" }}><span>What I tried / researched</span><textarea required rows={3} value={form.whatITried} onChange={(e)=>setForm({...form,whatITried:e.target.value})} /></label>
            <label className="grid" style={{ gap: ".35rem" }}><span>Specific question</span><textarea required rows={3} value={form.question} onChange={(e)=>setForm({...form,question:e.target.value})} /></label>
            <label className="grid" style={{ gap: ".35rem" }}><span>Code snippet / link (optional)</span><textarea rows={3} value={form.codeSnippet} onChange={(e)=>setForm({...form,codeSnippet:e.target.value})} /></label>
            <button className="btn btn-primary">Raise clarification ticket</button>
          </form>
        )}
        <div className="grid" style={{ gap: ".75rem" }}>
          {items.map((c) => (
            <article key={c.id} className="card" style={{ padding: "1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:".5rem" }}><strong>{c.display_name}</strong><span className="pill">{c.status}</span></div>
              <div className="muted"><strong>Question:</strong> {c.question}</div>
              <div className="muted"><strong>Tried:</strong> {c.what_i_tried}</div>
              {c.code_snippet && <pre style={{ whiteSpace:"pre-wrap", fontSize:".85rem" }}>{c.code_snippet}</pre>}
              {c.mentor_reply && <div><strong>Mentor:</strong> {c.mentor_reply}</div>}
              {c.learner_followup_note && <div><strong>Learner follow-up:</strong> {c.learner_followup_note}</div>}
              <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap", marginTop:".5rem" }}>
                {role === "MENTEE" && c.status === "follow_up_requested" && <button className="btn" onClick={()=>learnerReply(c.id,"open")}>Reply with context</button>}
                {role === "MENTEE" && c.status !== "resolved" && <button className="btn" onClick={()=>learnerReply(c.id,"resolved")}>Mark resolved</button>}
                {role === "MENTOR" && <><button className="btn" onClick={()=>mentorRespond(c.id,"answered")}>Answer</button><button className="btn" onClick={()=>mentorRespond(c.id,"follow_up_requested")}>Request follow-up</button><button className="btn" onClick={()=>mentorRespond(c.id,"resolved")}>Resolve</button></>}
              </div>
            </article>
          ))}
          {!items.length && <p className="muted">No clarification tickets yet.</p>}
        </div>
      </aside>
      <style>{`.drawer-backdrop{position:fixed;inset:0;background:rgba(17,19,24,.35);display:flex;justify-content:flex-end;z-index:50}.drawer{width:min(640px,100vw);height:100%;overflow:auto;background:var(--bg);border-left:1px solid var(--border);padding:1.25rem}.drawer-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;position:sticky;top:0;background:var(--bg);padding-bottom:.75rem}`}</style>
    </div>
  );
}
