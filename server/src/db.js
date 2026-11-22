import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "dev8.sqlite");
export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cohorts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      start_monday_date TEXT NOT NULL,
      timezone TEXT DEFAULT 'Africa/Lagos',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('MENTEE','MENTOR')),
      session_token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (cohort_id, display_name)
    );
    CREATE TABLE IF NOT EXISTS weekly_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
      completed_topic_ids TEXT DEFAULT '[]',
      personal_notes TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, week_number)
    );
    CREATE TABLE IF NOT EXISTS research_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
      title TEXT NOT NULL,
      url TEXT,
      takeaway TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS late_access_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
      reason TEXT NOT NULL,
      blockers TEXT DEFAULT '',
      requested_until_wat TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','granted','declined')),
      granted_until_wat TEXT,
      mentor_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, week_number)
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
      github_url TEXT NOT NULL,
      live_url TEXT,
      approach_note TEXT NOT NULL,
      ai_reflection_note TEXT NOT NULL,
      status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','approved','needs_revision','follow_up_requested')),
      mentor_feedback TEXT,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, week_number),
      UNIQUE (cohort_id, week_number, github_url)
    );
    CREATE TABLE IF NOT EXISTS clarifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
      topic_id TEXT NOT NULL,
      what_i_tried TEXT NOT NULL,
      question TEXT NOT NULL,
      code_snippet TEXT,
      mentor_reply TEXT,
      learner_followup_note TEXT,
      is_pinned_faq INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open' CHECK (status IN ('open','answered','follow_up_requested','resolved')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS peer_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      strength_note TEXT NOT NULL,
      suggestion_note TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (submission_id, reviewer_id)
    );
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
      status TEXT DEFAULT 'absent' CHECK (status IN ('present','absent','excused')),
      updated_by_mentor_id INTEGER REFERENCES users(id),
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (cohort_id, user_id, week_number)
    );
    CREATE TABLE IF NOT EXISTS rubric_scores (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      projects_score REAL DEFAULT 0 CHECK (projects_score BETWEEN 0 AND 100),
      understanding_score REAL DEFAULT 0 CHECK (understanding_score BETWEEN 0 AND 100),
      discussion_score REAL DEFAULT 0 CHECK (discussion_score BETWEEN 0 AND 100),
      weekly_tasks_score REAL DEFAULT 0 CHECK (weekly_tasks_score BETWEEN 0 AND 100),
      collaboration_score REAL DEFAULT 0 CHECK (collaboration_score BETWEEN 0 AND 100),
      mentor_summary TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_cohort_role ON users(cohort_id, role);
    CREATE INDEX IF NOT EXISTS idx_submissions_cohort_week ON submissions(cohort_id, week_number, status);
    CREATE INDEX IF NOT EXISTS idx_clarifications_cohort_week ON clarifications(cohort_id, week_number, status);
    CREATE INDEX IF NOT EXISTS idx_attendance_cohort_week ON attendance_records(cohort_id, week_number);
  `);
}

export function seed() {
  const existing = db.prepare("SELECT id FROM cohorts WHERE code = ?").get("DEV8-2026");
  if (existing) return;
  const info = db.prepare("INSERT INTO cohorts (code, name, start_monday_date, timezone) VALUES (?,?,?,?)")
    .run("DEV8-2026", "Dev8 Cohort 1", "2026-11-16", "Africa/Lagos");
  return info.lastInsertRowid;
}
