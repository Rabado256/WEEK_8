import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db, migrate, seed } from "./db.js";
import { authRequired, requireRole, signSession } from "./auth.js";
import { getWeekLockState } from "./scheduleWat.js";
import { computeWeightedScore } from "./scoring.js";
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

app.get("/api/weeks/:weekNumber/submission/me", authRequired, (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const submission = db.prepare("SELECT * FROM submissions WHERE user_id = ? AND week_number = ?").get(req.user.id, weekNumber);
  const lateAccess = db.prepare("SELECT * FROM late_access_requests WHERE user_id = ? AND week_number = ?").get(req.user.id, weekNumber);
  res.json({ submission, lateAccess });
});

app.get("/api/mentor/submissions", authRequired, requireRole("MENTOR"), (req, res) => {
  const weekNumber = weekNum(req.query.week) || 1;
  const rows = db.prepare(`
    SELECT s.*, u.display_name,
      (SELECT status FROM late_access_requests la WHERE la.user_id=s.user_id AND la.week_number=s.week_number) AS late_access_status
    FROM submissions s JOIN users u ON u.id=s.user_id
    WHERE s.cohort_id=? AND s.week_number=?
    ORDER BY s.updated_at DESC`).all(req.user.cohort_id, weekNumber);
  res.json({ submissions: rows });
});

app.get("/api/mentor/late-access", authRequired, requireRole("MENTOR"), (req, res) => {
  const weekNumber = weekNum(req.query.week) || 1;
  const rows = db.prepare(`
    SELECT la.*, u.display_name FROM late_access_requests la
    JOIN users u ON u.id=la.user_id
    WHERE la.cohort_id=? AND la.week_number=?
    ORDER BY la.updated_at DESC`).all(req.user.cohort_id, weekNumber);
  res.json({ requests: rows });
});

app.patch("/api/submissions/:id/review", authRequired, requireRole("MENTOR"), (req, res) => {
  const status = ["approved", "needs_revision", "follow_up_requested"].includes(req.body?.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ error: "Invalid status" });
  const mentorFeedback = String(req.body?.mentorFeedback || "").trim();
  const result = db.prepare("UPDATE submissions SET status=?, mentor_feedback=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND cohort_id=?")
    .run(status, mentorFeedback, req.params.id, req.user.cohort_id);
  if (!result.changes) return res.status(404).json({ error: "Submission not found" });
  res.json({ ok: true });
});

app.get("/api/weeks/:weekNumber/clarifications", authRequired, (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const base = `SELECT c.*, u.display_name FROM clarifications c JOIN users u ON u.id=c.user_id WHERE c.cohort_id=? AND c.week_number=?`;
  const rows = req.user.role === "MENTOR"
    ? db.prepare(`${base} ORDER BY c.updated_at DESC`).all(req.user.cohort_id, weekNumber)
    : db.prepare(`${base} AND (c.user_id=? OR c.is_pinned_faq=1) ORDER BY c.updated_at DESC`).all(req.user.cohort_id, weekNumber, req.user.id);
  res.json({ clarifications: rows });
});

app.post("/api/weeks/:weekNumber/clarifications", authRequired, requireRole("MENTEE"), (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const topicId = String(req.body?.topicId || "").trim();
  const whatITried = String(req.body?.whatITried || "").trim();
  const question = String(req.body?.question || "").trim();
  const codeSnippet = String(req.body?.codeSnippet || "").trim() || null;
  if (!topicId || !whatITried || !question) return res.status(400).json({ error: "topicId, whatITried, and question required" });
  const info = db.prepare("INSERT INTO clarifications (user_id, cohort_id, week_number, topic_id, what_i_tried, question, code_snippet) VALUES (?,?,?,?,?,?,?)")
    .run(req.user.id, req.user.cohort_id, weekNumber, topicId, whatITried, question, codeSnippet);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.patch("/api/clarifications/:id/respond", authRequired, requireRole("MENTOR"), (req, res) => {
  const status = ["answered", "follow_up_requested", "resolved"].includes(req.body?.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ error: "Invalid status" });
  const mentorReply = String(req.body?.mentorReply || "").trim();
  const isPinnedFaq = req.body?.isPinnedFaq ? 1 : 0;
  const result = db.prepare("UPDATE clarifications SET status=?, mentor_reply=?, is_pinned_faq=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND cohort_id=?")
    .run(status, mentorReply, isPinnedFaq, req.params.id, req.user.cohort_id);
  if (!result.changes) return res.status(404).json({ error: "Clarification not found" });
  res.json({ ok: true });
});

app.patch("/api/clarifications/:id/learner-reply", authRequired, requireRole("MENTEE"), (req, res) => {
  const status = ["open", "resolved"].includes(req.body?.status) ? req.body.status : "open";
  const learnerNote = String(req.body?.learnerNote || "").trim();
  const result = db.prepare("UPDATE clarifications SET status=?, learner_followup_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?")
    .run(status, learnerNote, req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Clarification not found" });
  res.json({ ok: true });
});

app.get("/api/weeks/:weekNumber/gallery", authRequired, (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  if (req.user.role === "MENTEE") {
    const mine = db.prepare("SELECT id FROM submissions WHERE user_id=? AND week_number=?").get(req.user.id, weekNumber);
    if (!mine) return res.status(403).json({ error: "Submit your Week project to unlock the peer gallery." });
  }
  const submissions = db.prepare(`
    SELECT s.id, s.github_url, s.live_url, s.approach_note, s.status, u.display_name
    FROM submissions s JOIN users u ON u.id=s.user_id
    WHERE s.cohort_id=? AND s.week_number=? ORDER BY s.updated_at DESC`).all(req.user.cohort_id, weekNumber);
  const reviews = db.prepare(`
    SELECT pr.*, u.display_name AS reviewer_name FROM peer_reviews pr
    JOIN users u ON u.id=pr.reviewer_id
    WHERE pr.submission_id IN (SELECT id FROM submissions WHERE cohort_id=? AND week_number=?) ORDER BY pr.created_at DESC`).all(req.user.cohort_id, weekNumber);
  res.json({ submissions, reviews });
});

app.post("/api/submissions/:id/peer-review", authRequired, requireRole("MENTEE"), (req, res) => {
  const strengthNote = String(req.body?.strengthNote || "").trim();
  const suggestionNote = String(req.body?.suggestionNote || "").trim();
  if (!strengthNote || !suggestionNote) return res.status(400).json({ error: "strengthNote and suggestionNote required" });
  const submission = db.prepare("SELECT * FROM submissions WHERE id=? AND cohort_id=?").get(req.params.id, req.user.cohort_id);
  if (!submission) return res.status(404).json({ error: "Submission not found" });
  if (submission.user_id === req.user.id) return res.status(400).json({ error: "Cannot review your own submission" });
  const mine = db.prepare("SELECT id FROM submissions WHERE user_id=? AND week_number=?").get(req.user.id, submission.week_number);
  if (!mine) return res.status(403).json({ error: "Submit your own project before reviewing peers" });
  try {
    db.prepare("INSERT INTO peer_reviews (submission_id, reviewer_id, strength_note, suggestion_note) VALUES (?,?,?,?)")
      .run(submission.id, req.user.id, strengthNote, suggestionNote);
    res.status(201).json({ ok: true });
  } catch {
    res.status(409).json({ error: "You already reviewed this submission" });
  }
});

app.patch("/api/weeks/:weekNumber/attendance/:userId", authRequired, requireRole("MENTOR"), (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  const userId = Number(req.params.userId);
  const status = ["present", "absent", "excused"].includes(req.body?.status) ? req.body.status : null;
  if (!weekNumber || !Number.isInteger(userId) || !status) return res.status(400).json({ error: "Invalid request" });
  const mentee = db.prepare("SELECT id FROM users WHERE id=? AND cohort_id=? AND role='MENTEE'").get(userId, req.user.cohort_id);
  if (!mentee) return res.status(404).json({ error: "Mentee not found" });
  db.prepare(`INSERT INTO attendance_records (cohort_id, user_id, week_number, status, updated_by_mentor_id, updated_at)
    VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(cohort_id, user_id, week_number) DO UPDATE SET status=excluded.status, updated_by_mentor_id=excluded.updated_by_mentor_id, updated_at=CURRENT_TIMESTAMP`)
    .run(req.user.cohort_id, userId, weekNumber, status, req.user.id);
  res.json({ ok: true });
});

app.get("/api/weeks/:weekNumber/attendance", authRequired, requireRole("MENTOR"), (req, res) => {
  const weekNumber = weekNum(req.params.weekNumber);
  if (!weekNumber) return res.status(400).json({ error: "Invalid week" });
  const rows = db.prepare(`
    SELECT u.id AS user_id, u.display_name, COALESCE(a.status, 'absent') AS status
    FROM users u LEFT JOIN attendance_records a ON a.user_id=u.id AND a.cohort_id=u.cohort_id AND a.week_number=?
    WHERE u.cohort_id=? AND u.role='MENTEE' ORDER BY u.display_name`).all(weekNumber, req.user.cohort_id);
  res.json({ attendance: rows });
});

app.get("/api/scores/me", authRequired, requireRole("MENTEE"), (req, res) => {
  const row = db.prepare("SELECT * FROM rubric_scores WHERE user_id=?").get(req.user.id);
  const attendance = db.prepare("SELECT week_number, status FROM attendance_records WHERE user_id=? ORDER BY week_number").all(req.user.id);
  const score = computeWeightedScore(row || {});
  res.json({ score: { ...score, mentorSummary: row?.mentor_summary || "" }, attendance });
});

app.put("/api/mentees/:userId/scores", authRequired, requireRole("MENTOR"), (req, res) => {
  const userId = Number(req.params.userId);
  const mentee = db.prepare("SELECT id FROM users WHERE id=? AND cohort_id=? AND role='MENTEE'").get(userId, req.user.cohort_id);
  if (!mentee) return res.status(404).json({ error: "Mentee not found" });
  const score = computeWeightedScore(req.body || {});
  const mentorSummary = String(req.body?.mentorSummary || "").trim();
  db.prepare(`INSERT INTO rubric_scores (user_id, projects_score, understanding_score, discussion_score, weekly_tasks_score, collaboration_score, mentor_summary, updated_at)
    VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET projects_score=excluded.projects_score, understanding_score=excluded.understanding_score, discussion_score=excluded.discussion_score, weekly_tasks_score=excluded.weekly_tasks_score, collaboration_score=excluded.collaboration_score, mentor_summary=excluded.mentor_summary, updated_at=CURRENT_TIMESTAMP`)
    .run(userId, score.projects, score.understanding, score.discussion, score.weeklyTasks, score.collaboration, mentorSummary);
  res.json({ ok: true, score: { ...score, mentorSummary } });
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
  if (!canSubmit) return res.status(403).json({ error: "Cutoff closed. Submit a late-access reason for mentor review." });
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
  const followUps = db.prepare("SELECT COUNT(*) c FROM submissions WHERE cohort_id=? AND week_number=? AND status IN ('follow_up_requested','needs_revision')").get(req.user.cohort_id, weekNumber).c;
  const openClarifications = db.prepare("SELECT COUNT(*) c FROM clarifications WHERE cohort_id=? AND week_number=? AND status IN ('open','follow_up_requested')").get(req.user.cohort_id, weekNumber).c;
  const lateAccess = db.prepare("SELECT COUNT(*) c FROM late_access_requests WHERE cohort_id=? AND week_number=? AND status IN ('pending','granted')").get(req.user.cohort_id, weekNumber).c;
  const lockedPastCutoff = db.prepare("SELECT COUNT(*) c FROM users u WHERE u.cohort_id=? AND u.role='MENTEE' AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.user_id=u.id AND s.week_number=?)").get(req.user.cohort_id, weekNumber).c;
  const mentees = db.prepare("SELECT id, display_name FROM users WHERE cohort_id=? AND role='MENTEE' ORDER BY display_name").all(req.user.cohort_id);
  res.json({ cohort: { startMondayDate: cohort.start_monday_date }, weekNumber, counts: { submitted, lockedPastCutoff, lateAccess, followUps, openClarifications }, mentees });
});

const port = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Dev8 API listening on ${port}`));
}
export default app;
