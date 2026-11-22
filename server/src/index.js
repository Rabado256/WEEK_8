import "dotenv/config";
import express from "express";
import cors from "cors";
import { db, migrate, seed } from "./db.js";
import { authRequired, joinOrCreate, signSession } from "./auth.js";
import { getWeekLockState } from "./scheduleWat.js";
import curriculum from "../../client/src/data/curriculum.json" with { type: "json" };

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true }));
app.use(express.json());
migrate();
seed();

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/join", async (req, res) => {
  try {
    const { cohortCode, displayName, pin, role = "MENTEE" } = req.body || {};
    const { user, cohort } = await joinOrCreate({ cohortCode, displayName, pin, role });
    const token = signSession(user);
    res.json({ token, user: { id: user.id, displayName: user.display_name, role: user.role }, cohort: { id: cohort.id, code: cohort.code, name: cohort.name, startMondayDate: cohort.start_monday_date, timezone: cohort.timezone } });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Server error" });
  }
});

app.get("/api/weeks", authRequired, (req, res) => {
  const cohort = db.prepare("SELECT * FROM cohorts WHERE id = ?").get(req.user.cohort_id);
  const weeks = curriculum.weeks.map((w) => {
    const submission = db.prepare("SELECT id, status FROM submissions WHERE user_id = ? AND week_number = ?").get(req.user.id, w.weekNumber);
    const lateAccess = db.prepare("SELECT status, granted_until_wat FROM late_access_requests WHERE user_id = ? AND week_number = ?").get(req.user.id, w.weekNumber);
    const state = getWeekLockState({ now: new Date(), startMondayDate: cohort.start_monday_date, weekNumber: w.weekNumber, hasSubmission: !!submission, lateAccess, reviewStatus: submission?.status });
    return { weekNumber: w.weekNumber, title: w.title, state, hasSubmission: !!submission, submissionStatus: submission?.status || null, lateAccessStatus: lateAccess?.status || null };
  });
  res.json({ weeks, timezone: cohort.timezone, startMondayDate: cohort.start_monday_date });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Dev8 API listening on ${port}`));
