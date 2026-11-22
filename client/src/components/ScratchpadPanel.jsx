import { useMemo, useState } from "react";

const DEFAULT_HTML = "<main>\n  <h1>Hello Dev8</h1>\n  <p>Test your idea here.</p>\n</main>";
const DEFAULT_CSS = "body{font-family:'Segoe UI',sans-serif;padding:2rem;background:#0b1220;color:#eef4ff;} h1{color:#10b981;} button{background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;border:0;padding:.6rem 1rem;border-radius:8px;}";
const DEFAULT_JS = "console.log('Dev8 scratchpad ready');";

export default function ScratchpadPanel({ weekNumber, sandboxMode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("HTML");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const srcDoc = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${html}<script>${js.replace(/<\/script>/g, "<\\/script>")}</script></body></html>`, [html, css, js]);

  if (sandboxMode !== "built-in") {
    return (
      <section className="card">
        <h2>Cloud starter</h2>
        <p className="muted">Weeks 5–8 use 1-click cloud environments for framework and full-stack work.</p>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <a className="btn btn-primary" href="https://stackblitz.com/fork/vitejs/vite/tree/main/packages/create-vite/template-react" target="_blank" rel="noreferrer">Open StackBlitz</a>
          <a className="btn" href="https://codesandbox.io/s/new" target="_blank" rel="noreferrer">Open CodeSandbox</a>
        </div>
      </section>
    );
  }

  const value = tab === "HTML" ? html : tab === "CSS" ? css : js;
  const setValue = tab === "HTML" ? setHtml : tab === "CSS" ? setCss : setJs;

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div><h2 style={{ marginBottom: 0 }}>Scratchpad</h2><p className="muted" style={{ margin: 0 }}>Week {weekNumber} built-in HTML/CSS/JS sandbox.</p></div>
        <button className="btn" onClick={() => setOpen((v) => !v)}>{open ? "Collapse" : "Open scratchpad"}</button>
      </div>
      {open && (
        <div className="grid" style={{ marginTop: "1rem", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          <div>
            <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>{["HTML","CSS","JS"].map((t) => <button key={t} className="btn" style={t===tab?{borderColor:"var(--accent)",color:"var(--accent)"}:undefined} onClick={() => setTab(t)}>{t}</button>)}</div>
            <textarea aria-label={`${tab} editor`} value={value} onChange={(e) => setValue(e.target.value)} rows={14} style={{ fontFamily: "ui-monospace, monospace" }} />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: ".5rem" }}>Preview</div>
            <iframe title="Scratchpad preview" sandbox="allow-scripts" srcDoc={srcDoc} style={{ width: "100%", minHeight: 320, border: "1px solid var(--border)", borderRadius: 8, background: "#fff" }} />
          </div>
        </div>
      )}
    </section>
  );
}
