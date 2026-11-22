import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db, migrate, seed } from "./db.js";
import { authRequired, requireRole, signSession } from "./auth.js";
import { getWeekLockState } from "./scheduleWat.js";
import curriculum from "../../client/src/data/curriculum.json" with { type: "json" };

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true }));
app.use(express.json());
migrate();
seed();

const GITHUB_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
const weekNum = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 8 ? n : null; };
const getCohort = (req) => db.prepare("SELECT * FROM cohorts WHERE id = ?").get(req.user.cohort_id);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/join", async (req, res) => {
  try {
    const cohortCode = String(req.body?.cohortCode || "").trim().toUpperCase();
    const displayName = String(req.body?.displayName || "").trim();
    const pin = String(req.body?.pin || "");
    const role = req.body?.role === "MENTOR" ? "MENTOR" : "MENTEE";
    const cohort = db.prepare("SELECT * FROM cohorts WHERE code = ?").get(cohortCode);
    if (!cohort) return res.status(404).json({ error: "Invalid cohort code" });
    if (!displayName || pin.length < 4) return res.status(400).json({ error: "Display name and 4+ digit PIN required" });
    let user = db.prepare("SELECT * FROM users WHERE cohort_id = ? AND display_name = ?").get(cohort.id, displayName);
    if (user) {
      const ok = await bcrypt.compare(pin, user.pin_hash);
      if (!ok) return res.status(401).json({ error: "Invalid PIN" });
      if (user.role !== role) return res.status(403).json({ error: "Role does not match this account" });
    } else {
      if (role === "MENTOR") return res.status(403).json({ error: "Mentor account must be pre-created" });
      const pinHash = await bcrypt.hash(pin, 10);
      const sessionToken = uuid();
      const info = db.prepare("INSERT INTO users (cohort_id, display_name, pin_hash, role, session_token) VALUES (?,?,?,?,?)").run(cohort.id, displayName, pinHash, role, sessionToken);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    }
    const token = signSession(user);
    res.json({ token, user: { id: user.id, displayName: user.display_name, role: user.role }, cohort: { id: cohort.id, code: cohort.code, name: cohort.name, startMondayDate: cohort.start_monday_date, timezone: cohort.timezone } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

app.get("/api/me", authRequired, (req, res) => {
  const cohort = getCohort(req);
  res.json({ user: { id: req.user.id, displayName: req.user.display_name, role: req.user.role }, cohort: { id: cohort.id, code: cohort.code, name: cohort.name, startMondayDate: cohort.start_monday_date, timezone: cohort.timezone } });
});

app.get("/api/weeks", authRequired, (req, res) => {
  const cohort = getCohort(req);
  const weeks = curriculum.weeks.map((w) => {
    const submission = db.prepare("SELECT id, status FROM submissions WHERE user_id = ? AND week_number = ?").get(req.user.id, w.weekNumber);
    const lateAccess = db.prepare("SELECT status, granted_until_wat FROM late_access_requests WHERE user_id = ? AND week_number = ?").get(req.user.id, w.weekNumber);
    const progress = db.prepare("SELECT completed_topic_ids, personal_notes FROM weekly_progress WHERE user_id = ? AND week_number = ?").get(req.user.id, w.weekNumber);
    const state = getWeekLockState({ now: new Date(), startMondayDate: cohort.start_monday_date, weekNumber: w.weekNumber, hasSubmission: !!submission, lateAccess, reviewStatus: submission?.status });
    return { weekNumber: w.weekNumber, title: w.title, state, hasSubmission: !!submission, submissionStatus: submission?.status || null, lateAccessStatus: lateAccess?.status || null, progress: { completedTopicIds: JSON.parse(progress?.completed_topic_ids || "[]"), personalNotes: progress?.personal_notes || "" } };
  });
  res.json({ weeks, timezone: cohort.timezone, startMondayDate: cohort.start_monday_date });
});

app.patch("/api/weeks/:weekNumber/progress", authRequired, requireRole("MENTEE"), (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const completedTopicIds = JSON.stringify(Array.isArray(req.body?.completedTopicIds) ? req.body.completedTopicIds : []);
  const personalNotes = String(req.body?.personalNotes || "");
  db.prepare(`INSERT INTO weekly_progress (user_id, week_number, completed_topic_ids, personal_notes, updated_at)
    VALUES (?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, week_number) DO UPDATE SET completed_topic_ids=excluded.completed_topic_ids, personal_notes=excluded.personal_notes, updated_at=CURRENT_TIMESTAMP`)
    .run(req.user.id, weekNumber, completedTopicIds, personalNotes);
  res.json({ ok: true });
});

app.post("/api/weeks/:weekNumber/research-logs", authRequired, requireRole("MENTEE"), (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const title = String(req.body?.title || "").trim();
  const takeaway = String(req.body?.takeaway || "").trim();
  const url = String(req.body?.url || "").trim();
  if (!title || !takeaway) return res.status(400).json({ error: "Title and takeaway required" });
  const info = db.prepare("INSERT INTO research_logs (user_id, week_number, title, url, takeaway) VALUES (?,?,?,?,?)").run(req.user.id, weekNumber, title, url || null, takeaway);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get("/api/weeks/:weekNumber/research-logs", authRequired, (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const rows = db.prepare("SELECT id, title, url, takeaway, created_at FROM research_logs WHERE user_id = ? AND week_number = ? ORDER BY created_at DESC").all(req.user.id, weekNumber);
  res.json({ logs: rows });
});

app.post("/api/weeks/:weekNumber/submit", authRequired, requireRole("MENTEE"), (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const githubUrl = String(req.body?.githubUrl || "").trim();
  const liveUrl = String(req.body?.liveUrl || "").trim();
  const approachNote = String(req.body?.approachNote || "").trim();
  const aiReflectionNote = String(req.body?.aiReflectionNote || "").trim();
  if (!GITHUB_RE.test(githubUrl)) return res.status(400).json({ error: "Invalid GitHub repository URL" });
  if (!approachNote || !aiReflectionNote) return res.status(400).json({ error: "Approach and AI reflection required" });
  const cohort = getCohort(req);
  const existing = db.prepare("SELECT * FROM submissions WHERE user_id = ? AND week_number = ?").get(req.user.id, weekNumber);
  const lateAccess = db.prepare("SELECT status, granted_until_wat FROM late_access_requests WHERE user_id = ? AND week_number = ?").get(req.user.id, weekNumber);
  const state = getWeekLockState({ now: new Date(), startMondayDate: cohort.start_monday_date, weekNumber, hasSubmission: !!existing, lateAccess, reviewStatus: existing?.status });
  const canSubmit = ["active_open", "late_access_granted"].includes(state) || ["needs_revision", "follow_up_requested"].includes(existing?.status);
  if (!canSubmit) return res.status(403).json({ error: "Submission window closed for this week" });
  const dup = db.prepare("SELECT id FROM submissions WHERE cohort_id = ? AND week_number = ? AND github_url = ? AND user_id <> ?").get(req.user.cohort_id, weekNumber, githubUrl, req.user.id);
  if (dup) return res.status(409).json({ error: "This GitHub repository URL has already been submitted in this cohort for this week. Every project must represent your own work." });
  if (existing) {
    db.prepare("UPDATE submissions SET github_url=?, live_url=?, approach_note=?, ai_reflection_note=?, status='submitted', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(githubUrl, liveUrl || null, approachNote, aiReflectionNote, existing.id);
    return res.json({ ok: true, updated: true });
  }
  db.prepare("INSERT INTO submissions (user_id, cohort_id, week_number, github_url, live_url, approach_note, ai_reflection_note) VALUES (?,?,?,?,?,?,?)")
    .run(req.user.id, req.user.cohort_id, weekNumber, githubUrl, liveUrl || null, approachNote, aiReflectionNote);
  res.status(201).json({ ok: true });
});

app.post("/api/weeks/:weekNumber/late-access", authRequired, requireRole("MENTEE"), (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const reason = String(req.body?.reason || "").trim();
  if (!reason) return res.status(400).json({ error: "Reason required" });
  const blockers = String(req.body?.blockers || "").trim();
  const requestedUntil = String(req.body?.requestedUntilWat || "").trim() || null;
  db.prepare(`INSERT INTO late_access_requests (user_id, cohort_id, week_number, reason, blockers, requested_until_wat, status, updated_at)
    VALUES (?,?,?,?,?,?,'pending',CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, week_number) DO UPDATE SET reason=excluded.reason, blockers=excluded.blockers, requested_until_wat=excluded.requested_until_wat, status='pending', updated_at=CURRENT_TIMESTAMP`)
    .run(req.user.id, req.user.cohort_id, weekNumber, reason, blockers, requestedUntil);
  res.status(201).json({ ok: true });
});

app.patch("/api/late-access/:id/decision", authRequired, requireRole("MENTOR"), (req, res) => {
  const decision = req.body?.decision === "granted" ? "granted" : req.body?.decision === "declined" ? "declined" : null;
  if (!decision) return res.status(400).json({ error: "Invalid decision" });
  const grantedUntil = decision === "granted" ? (String(req.body?.grantedUntilWat || "").trim() || null) : null;
  const mentorNote = String(req.body?.mentorNote || "").trim();
  const result = db.prepare("UPDATE late_access_requests SET status=?, granted_until_wat=?, mentor_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND cohort_id=?").run(decision, grantedUntil, mentorNote, req.params.id, req.user.cohort_id);
  if (!result.changes) return res.status(404).json({ error: "Request not found" });
  res.json({ ok: true });
});

app.get("/api/mentor/overview", authRequired, requireRole("MENTOR"), (req, res) => {
  const cohort = getCohort(req);
  const weekNumber = weekNum(req.query.week) || 1;
  const submitted = db.prepare("SELECT COUNT(*) c FROM submissions WHERE cohort_id=? AND week_number=?").get(req.user.cohort_id, weekNumber).c;
  const followUps = db.prepare("SELECT COUNT(*) c FROM submissions WHERE cohort_id=? AND week_number=? AND status='follow_up_requested'").get(req.user.cohort_id, weekNumber).c;
  const openClarifications = db.prepare("SELECT COUNT(*) c FROM clarifications WHERE cohort_id=? AND week_number=? AND status IN ('open','follow_up_requested')").get(req.user.cohort_id, weekNumber).c;
  const lateAccess = db.prepare("SELECT COUNT(*) c FROM late_access_requests WHERE cohort_id=? AND week_number=? AND status IN ('pending','granted')").get(req.user.cohort_id, weekNumber).c;
  const mentees = db.prepare("SELECT id, display_name FROM users WHERE cohort_id=? AND role='MENTEE' ORDER BY display_name").all(req.user.cohort_id);
  res.json({ cohort: { startMondayDate: cohort.start_monday_date }, weekNumber, counts: { submitted, lateAccess, followUps, openClarifications }, mentees });
});

const port = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Dev8 API listening on ${port}`));
}
export default app;
