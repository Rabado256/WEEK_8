import curriculum from "../data/curriculum.json";

function safe(v) { return String(v ?? "").replace(/\r\n/g, "\n").trim(); }
function blockquote(text) { return safe(text).split("\n").map((l) => `> ${l}`).join("\n"); }

export function buildWeekNotesMarkdown(data) {
  const lines = [];
  lines.push(`# Dev8 Week Notes`);
  lines.push("");
  lines.push(`- **Learner:** ${safe(data.displayName)}`);
  lines.push(`- **Cohort:** ${safe(data.cohortCode)}`);
  lines.push(`- **Generated:** ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`## 5-Pillar Growth Summary`);
  lines.push("");
  const s = data.score || {};
  lines.push(`| Pillar | Weight | Score |`);
  lines.push(`|---|---:|---:|`);
  lines.push(`| Projects | 40% | ${s.projects ?? 0} |`);
  lines.push(`| Understanding & Code Quality | 20% | ${s.understanding ?? 0} |`);
  lines.push(`| Discussion & Participation | 15% | ${s.discussion ?? 0} |`);
  lines.push(`| Weekly Tasks | 15% | ${s.weeklyTasks ?? 0} |`);
  lines.push(`| Collaboration & Professionalism | 10% | ${s.collaboration ?? 0} |`);
  lines.push(`| **Weighted Total** | **100%** | **${s.weightedTotal ?? 0}** |`);
  lines.push("");
  if (s.mentorSummary) { lines.push(`**Mentor summary:** ${safe(s.mentorSummary)}`); lines.push(""); }
  lines.push(`## Attendance`);
  lines.push("");
  if (data.attendance?.length) data.attendance.forEach((a) => lines.push(`- Week ${a.week_number}: ${safe(a.status)}`));
  else lines.push(`- No attendance records yet.`);
  lines.push("");

  const progressByWeek = new Map((data.progress || []).map((p) => [p.week_number, p]));
  const logsByWeek = new Map();
  (data.logs || []).forEach((l) => { const arr = logsByWeek.get(l.week_number) || []; arr.push(l); logsByWeek.set(l.week_number, arr); });
  const subsByWeek = new Map();
  (data.submissions || []).forEach((s2) => { const arr = subsByWeek.get(s2.week_number) || []; arr.push(s2); subsByWeek.set(s2.week_number, arr); });
  const clarByWeek = new Map();
  (data.clarifications || []).forEach((c) => { const arr = clarByWeek.get(c.week_number) || []; arr.push(c); clarByWeek.set(c.week_number, arr); });

  for (const week of curriculum.weeks) {
    const wn = week.weekNumber;
    const p = progressByWeek.get(wn);
    const completed = new Set(Array.isArray(p?.completed_topic_ids) ? p.completed_topic_ids : []);
    lines.push(`## Week ${wn}: ${safe(week.title)}`);
    lines.push("");
    lines.push(`### Researched Topics`);
    lines.push("");
    week.outlineTopics.forEach((t) => lines.push(`- [${completed.has(t.id) ? "x" : " "}] ${safe(t.topic)} (${(t.researchKeywords || []).join(", ")})`));
    lines.push("");
    lines.push(`### What I Found & Learned`);
    lines.push("");
    const weekLogs = logsByWeek.get(wn) || [];
    if (weekLogs.length) weekLogs.forEach((l) => { lines.push(`- **${safe(l.title)}**${l.url ? ` (${safe(l.url)})` : ""}`); lines.push(`  - ${safe(l.takeaway)}`); });
    else lines.push(`- No research logs yet.`);
    lines.push("");
    lines.push(`### Submissions`);
    lines.push("");
    const weekSubs = subsByWeek.get(wn) || [];
    if (weekSubs.length) weekSubs.forEach((sub) => {
      lines.push(`- **Status:** ${safe(sub.status)}`);
      lines.push(`  - GitHub: ${safe(sub.github_url)}`);
      if (sub.live_url) lines.push(`  - Live: ${safe(sub.live_url)}`);
      lines.push(`  - Approach: ${safe(sub.approach_note)}`);
      lines.push(`  - AI Reflection: ${safe(sub.ai_reflection_note)}`);
      if (sub.mentor_feedback) lines.push(`  - Mentor Feedback: ${safe(sub.mentor_feedback)}`);
    });
    else lines.push(`- No submission yet.`);
    lines.push("");
    lines.push(`### Clarification Notes`);
    lines.push("");
    const weekClar = clarByWeek.get(wn) || [];
    if (weekClar.length) weekClar.forEach((c) => {
      lines.push(`- **[${safe(c.status)}]** ${safe(c.question)}`);
      lines.push(`  - Tried: ${safe(c.what_i_tried)}`);
      if (c.code_snippet) { lines.push(`  - Code/Link:`); lines.push(blockquote(c.code_snippet).split("\n").map((l)=>`    ${l}`).join("\n")); }
      if (c.mentor_reply) lines.push(`  - Mentor: ${safe(c.mentor_reply)}`);
      if (c.learner_followup_note) lines.push(`  - Learner follow-up: ${safe(c.learner_followup_note)}`);
    });
    else lines.push(`- No clarification notes.`);
    lines.push("");
    if (p?.personal_notes) { lines.push(`### Personal Notes`); lines.push(""); lines.push(safe(p.personal_notes)); lines.push(""); }
  }

  return lines.join("\n");
}

export function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
