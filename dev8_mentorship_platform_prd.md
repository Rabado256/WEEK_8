# Product Requirements Document (PRD): Dev8 — Weekly Mentorship & Accountability Platform

**Version:** 3.3 (Complete Public Landing + Weekly Mentorship & Accountability Specification)  
**Document Owner:** Principal Product Manager & Senior Full-Stack Architect  
**Cohort Reference Timezone:** `WAT (Africa/Lagos, UTC+1)`  
**Program Culture:** *Learn → Discuss → Build → Submit → Review → Improve → Ship*  
**Target Tech Stack:** React (Vite), Vanilla Modular CSS, Node.js/Express, PostgreSQL (Neon/Supabase) / SQLite (Local)  
**Infrastructure Budget:** $0.00 (100% Open-Source / Free-Tier Cloud Deployment)

---

## 1. Executive Summary & Product Vision

### 1.1 Elevator Pitch
**Dev8** is a quiet, commitment-based **8-week software development mentorship platform** combining a calm, transparent public onboarding experience with a disciplined weekly execution workspace. Instead of dropping visitors straight into a locked dashboard or feeding passive video playlists, Dev8 welcomes prospective and active learners through a clean 6-section learning home page before routing signed-in cohort members into their focused weekly workspace.

Once inside the cohort workspace, Dev8 drops **one focused Weekly Course Outline every Monday** (in `WAT / Africa/Lagos`). Learners independently research lessons and documentation for the outlined topics, practice in zero-setup sandboxes, log what they discovered, raise targeted *"Need Additional Explanation"* requests when stuck, and submit a **GitHub repository** with an approach and AI reflection before **Sunday 11:59 PM WAT** to unlock the next week.

### 1.2 Target Users & Roles
* **Visitor / Prospective Cohort Applicant:** Explores the public landing page (`/`) to understand the mentorship philosophy, weekly Mon–Sun cadence, AI/Vibe Coding ethics, 5-pillar evaluation rubric, and cohort outcomes before joining with a Cohort Code.
* **Learner (`MENTEE`):** A self-driven developer enrolled in the 8-week mentorship cohort who studies weekly course outlines independently, logs external resources/takeaways, builds weekly practical projects, participates in peer reviews, and communicates proactively with mentors.
* **Mentor (`MENTOR`):** An engineering mentor or program facilitator guiding a cohort who manages weekly roll-call attendance, reviews GitHub submissions, grants late-submission access when warranted, requests follow-ups, answers clarification requests, and scores learners across a transparent 5-pillar growth rubric.

### 1.3 Core Program Philosophy & Culture
Dev8 codifies the cohort's core culture directly into both its public narrative and its product workflow:

> **Learn → Discuss → Build → Submit → Review → Improve → Ship**

Every feature enforces practical execution over passive consumption: *"Watching is not enough. You have to build."*

---

## 2. Program Rules & How Dev8 Enforces Them

Dev8 translates all **8 Program Rules & Expectations**—plus the weekly cadence and accountability mechanics—directly into clear, non-intrusive product rules:

| Program Rule / Cadence Rule | Product Mechanism in Dev8 |
| :--- | :--- |
| **1. Learn & Build** *(Weekly topics + practical project; no passive watching)* | **Course Outline Only (No Spoon-Fed Lessons):** Each **Monday** (`WAT / Africa/Lagos`), a structured course outline drops with topics to research, search keywords, and a practical project brief. Learners go out and find their own lessons. |
| **2. Discussion & Participation** *(Ask questions, explain approach, review peers)* | **Cohort Solution Gallery & Peer Feedback:** Submitting a week's GitHub project unlocks that week's peer gallery where learners inspect peers' repositories and leave respectful, structured feedback. |
| **3. AI / Vibe Coding** *(AI allowed, but must understand, explain, modify & debug)* | **Mandatory "Explain Your Approach & AI Use" Note:** Every GitHub submission requires two reflections explaining how the solution works and which AI-generated parts the learner wrote, modified, or debugged themselves. |
| **4. Projects & Submissions** *(Own work only; no copying peers)* | **Unique GitHub Repo Guard & Resubmission Loop:** Backend validates `github.com/<user>/<repo>`, rejects duplicate repo URLs across cohort members, and supports `needs_revision` / `follow_up_requested` states. |
| **5. Deadlines & Commitment** *(Sunday 11:59 PM WAT cutoff; don't disappear, communicate)* | **Hard Sunday 11:59 PM WAT Cutoff + Late Access Request:** Submissions lock automatically after **Sunday 11:59 PM WAT**. Learners can submit a reason for non-submission; mentors can review and **grant submission access**. |
| **6. Respect & Community** *(No insults, mocking, or harassment; help others grow)* | **Pinned Program Charter Drawer & Structured Peer Notes:** Slide-over charter accessible from any screen + respectful *"What worked well"* / *"Constructive suggestion"* peer review prompts. |
| **7. Student Scoring** *(40% Projects, 20% Code Quality, 15% Discussion, 15% Weekly Tasks, 10% Collaboration)* | **Transparent 5-Pillar Growth Scorecard:** Live weighted breakdown visible to the learner and mentor—framed around personal growth rather than public competition. |
| **8. Your Responsibility & Mentor Support** *(Learners do independent work; mentors guide & clarify)* | **Self-Research Log, Clarification Tickets, Mentor Follow-Up & Roll Call:** Learners track independent research, raise *"Need Additional Explanation"* tickets with optional code/sandbox context, respond to mentor `REQUEST_FOLLOW_UP` prompts, and are marked via mentor roll-call toggles. |

---

## 3. Design Philosophy & Navigation Architecture

### 3.1 The "Quiet UI" Principles
1. **Context Before Workspace:** New visitors land on a calm, editorial **6-section Landing Page (`/`)** that explains the mentorship expectations before prompting for credentials. Returning authenticated users see a prominent top **"Continue to Week X →"** bar (or quick-route to `/dashboard` / `/mentor`) so returning learners never suffer scroll fatigue.
2. **One Active Week at a Time (Inside `/dashboard`):** Once signed in, learners land directly on their **Active Week Focus Card**. Future weeks remain locked behind the **Monday** weekly drop schedule and the current week's GitHub submission gate.
3. **70% Breathing Room & Progressive Disclosure:** No permanent multi-column sidebars, noisy chat feeds, or gamified confetti popups. Secondary workspace views (8-Week Roadmap, Clarification Tickets, Peer Gallery, Program Charter & 5-Pillar Scorecard) open inside clean **slide-over drawers**.
4. **Zero Pre-Packaged Media Bloat:** Both the public landing page and the weekly workspace avoid heavy hero videos, carousel libraries, and embedded video walls so learners on mobile data experience sub-150 KB initial loads.
5. **Explicit Timezone & Calm Dual Themes:** All deadlines explicitly display **`WAT (Africa/Lagos)`** alongside warm paper light mode (`#FAF9F6`) and deep slate dark mode (`#111318`).

### 3.2 Client-Side Routing Map
* **`/` (Public Landing Page):** 6-section learning portal (`Welcome`, `Introduce the Mentorship`, `How It Works`, `Why Us`, `Success Stories`, `Footer`).
* **`/login` (or Auth Drawer):** Frictionless Cohort Code + Display Name + PIN login (routes `MENTEE` → `/dashboard`, `MENTOR` → `/mentor`).
* **`/dashboard` (Protected Mentee Workspace):** Active Week Focus Card, Independent Research Log, Sandboxes, Clarification Tickets, Late-Access Requests, and GitHub Submission Gate.
* **`/mentor` (Protected Mentor Workspace):** Cohort Status Strip, Weekly Roll-Call Attendance Toggles, Submission Reviews, Late-Access Access Grants, Follow-Up Requests, and 5-Pillar Scoring.

---

## 4. Core Functional Requirements (MVP)

### Feature 0: Public 6-Section Learning Landing Page (`/`)
To align with modern learning platform onboarding while honoring Dev8's Quiet UI and low-bandwidth principles, `/` renders six structured, lightweight sections:
1. **Welcome Hero:**
   * Headline positioning Dev8 as an 8-week, commitment-based mentorship cohort built around real shipping.
   * Primary CTA (**Enter Cohort Workspace** → `/login`) and Secondary CTA (**See How It Works** → smooth scroll to `#how-it-works`).
   * Returning-user banner if a valid session token exists in `localStorage` (*"Welcome back, [Name] — Jump to Week X →"*).
2. **Introduce the Mentorship:**
   * Explains the **"Course Outlines Only, Independent Research, Real Guidance"** philosophy—why learners research their own lessons instead of passively watching tutorials, supported by the **Learn → Discuss → Build → Submit → Review → Improve → Ship** loop.
3. **How It Works (The Weekly Mon–Sun WAT Rhythm):**
   * Visual 4-step cadence timeline:
     1. **Monday (`WAT`):** Weekly course outline & practical project brief drop automatically.
     2. **Mon–Sat:** Independent research, sandbox practice, peer discussion, and *"Need Additional Explanation"* mentor support.
     3. **Sunday 11:59 PM `WAT`:** Hard cutoff to submit your GitHub repo + Approach & AI reflection.
     4. **Review & Unlock:** Mentor feedback, peer code review, and automatic unlock of the next week.
4. **Why Us (Standards That Build Real Developers):**
   * 4 concise pillars: **Anti-Copy AI Ethics** (AI encouraged, blind copy-pasting rejected), **GitHub-Gated Mastery**, **Transparent 5-Pillar Growth Scoring** (`40% / 20% / 15% / 15% / 10%`), and **Zero-Noise Low-Data Design**, plus a trigger to inspect the full **Program Charter Drawer**.
5. **Success Stories & Cohort Outcomes:**
   * Showcases real mentee growth reflections and tangible shipped capstone milestones (with links to sample GitHub repositories/live demos, plus a clean *"8-Week Shipped Outcomes"* showcase state for Cohort 1).
6. **Footer:**
   * Minimal navigation anchors (*Mentorship*, *How It Works*, *Why Us*, *Success Stories*, *Program Rules*, *Cohort Sign-In*), explicit `WAT (Africa/Lagos)` cohort clock/timezone reference, and low-bandwidth notice.

### Feature 1: Monday Course Outline Drop, Sunday 11:59 PM WAT Cutoff & GitHub Gate
* **Monday Outline Drop:** Each week's course outline becomes active on its scheduled **Monday** in `WAT (Africa/Lagos)` (with a mentor override option if a cohort starts mid-week or needs early/delayed publishing).
* **Sunday 11:59 PM WAT Cutoff:** Each week's standard GitHub submission window closes automatically at **Sunday 11:59 PM WAT (`23:59:59 Africa/Lagos`)**. Once closed, standard submission is locked unless:
  1. The learner has an active **Mentor Late-Submission Access Grant** for that week, or
  2. The learner is **resubmitting** an existing submission where the mentor explicitly set `status = 'needs_revision'` or `'follow_up_requested'`.
* **GitHub Progression Gate:** A learner cannot advance to Week $N + 1$ until they have submitted a valid GitHub repository URL for Week $N$'s project (even if Monday of Week $N + 1$ has arrived).
* **Course Outline Only (No Lessons Given):** Each week displays:
  * **Weekly Theme & Explicit Deadline** (`Due Sunday 11:59 PM WAT` + live status/lock indicator).
  * **Topics & Concepts to Research** (topics and search keywords for independent lesson discovery, with self-check toggles).
  * **Practical Project Brief & Acceptance Criteria** (concrete deliverables).

### Feature 2: Independent "What I Found & Learned" Research Log & Zero-Setup Sandboxes
* **Independent Research Log:** Because learners go find their own lessons outside the platform, each week includes a calm **Research Log** where learners can record a resource title/link they discovered on their own plus a concise takeaway note. Entries automatically feed into the **1-Click Export My Notes (`.md`)** file.
* **Weeks 1–4 (Built-In HTML/CSS/JS Scratchpad):** A collapsible split-pane editor (`HTML`, `CSS`, `JS` tabs + sandboxed `<iframe srcDoc>` preview) for testing concepts researched during the week with zero local setup.
* **Weeks 5–8 (1-Click Cloud Starters):** Direct launch buttons for **StackBlitz** or **CodeSandbox** starter templates suited to frontend frameworks, backend APIs, and full-stack projects.

### Feature 3: Late-Submission Reason & Mentor Access Grant Flow (Rule #5)
* **Submitting a Reason for Non-Submission:** If a learner misses or cannot meet the **Sunday 11:59 PM WAT** deadline—or is locked out past cutoff—they can submit a **Late-Submission / Non-Submission Reason** stating:
  * *Why the submission was missed or delayed*
  * *Current progress / blockers*
  * *Requested submission window / target date*
* **Mentor Access Grant:** Mentors review pending reason requests in their triage drawer and can **Grant Submission Access** (setting `late_access_granted = TRUE` and optional `access_expires_at` timestamp in `WAT`), immediately enabling the learner's GitHub submission form for that week, or **Decline / Request Check-In** with a note.

### Feature 4: In-Week "Request Additional Explanation" & Mentor `REQUEST_FOLLOW_UP` Loop
* **Learner Clarification Request:** Within any active week, a learner can click **"Need Additional Explanation"** to raise a ticket containing:
  * *Outline Topic* (from that week's course outline)
  * *What I Tried / Researched Independently*
  * *Specific Question*
  * *Optional Code Snippet or Sandbox/Repo Link* ("Show Where I'm Stuck")
* **Mentor Response & `REQUEST_FOLLOW_UP`:** Mentors can respond to a clarification ticket or a project submission using clear resolution/review states—including explicitly selecting **`REQUEST_FOLLOW_UP`** with a targeted follow-up prompt.
  * When a mentor requests a follow-up on a **clarification ticket**, the learner sees a `Follow-Up Requested` badge and can reply with additional code/context until marked `Resolved`.
  * When a mentor requests a follow-up on a **GitHub submission**, the learner can address the mentor's notes in their approach reflection and push/resubmit their updated GitHub repo.

### Feature 5: Weekly GitHub Project Submission & Vibe-Coding Reflection
* **Submission Form:** To complete a week's project, the learner provides:
  1. **GitHub Repository URL** (`https://github.com/<username>/<repo-name>`, validated format + duplicate check across the cohort).
  2. **Live Demo URL** (optional).
  3. **Approach Explanation (Required):** How the solution works and key engineering decisions.
  4. **AI / Vibe Coding Reflection (Required):** Which parts of the code were written, modified, or debugged by the learner rather than blindly copied from AI.
* **Post-Submission Peer Solution Gallery:** Once a learner submits their own GitHub link for Week $N$, they unlock Week $N$'s **Peer Gallery** to inspect classmates' repositories and leave respectful feedback (*"What worked well"* + *"Constructive suggestion"*).

### Feature 6: Mentor Roll-Call Attendance Toggle, Cohort Status Strip & 5-Pillar Scorecard
* **Mentor Roll-Call Attendance Toggle:** For each week's session, mentors have a direct **Roll-Call Toggle** per learner (`present`, `absent`, `excused`)—no learner attendance forms required. Attendance history is visible on the learner's progress/scorecard view and informs professionalism/participation evaluation.
* **Mentor Cohort Status Strip:** At the top of the Mentor view for the selected week, a compact status strip displays live counts for:
  * `Submitted`
  * `Locked / Past Cutoff`
  * `Late Access Requested / Granted`
  * `Follow-Up Requested`
  * `Open Clarifications`
* **Transparent 5-Pillar Weighted Scorecard (Rule #7):** Mentors score learners across the five required pillars, with the system automatically computing the weighted total:
  * **Projects:** `40%`
  * **Understanding & Code Quality:** `20%`
  * **Discussion & Participation:** `15%`
  * **Weekly Tasks:** `15%`
  * **Collaboration & Professionalism:** `10%`
* **Formula:**
  $$\text{Weighted Score} = 0.40(P) + 0.20(U) + 0.15(D) + 0.15(T) + 0.10(C)$$
  *(Where each pillar score $P, U, D, T, C \in [0, 100]$. Displayed privately to the learner alongside mentor feedback—never as a competitive public leaderboard.)*

### Feature 7: Program Charter Drawer & 1-Click Markdown Study/Portfolio Export
* **Program Charter Drawer:** Pinned access (from both the landing page and authenticated views) to all 8 Program Rules, cadence/cutoff rules, scoring weights, and the *Learn → Discuss → Build → Submit → Review → Improve → Ship* culture.
* **1-Click `.md` Export:** Exports a clean `dev8-week-notes.md` file containing the learner's researched topics, *"What I Found & Learned"* log, submitted GitHub links, approach/AI reflections, clarification notes, attendance status, and current 5-pillar growth summary.

---

## 5. Technical Architecture & Data Specification

### 5.1 System Data Flow Diagram (ASCII)

```
+-------------------------------------------------------------------+
|                     FRONTEND (React + Vite)                       |
|  [ / ] Public 6-Section Landing Page (Welcome -> Mentorship ->    |
|        How It Works -> Why Us -> Success Stories -> Footer)       |
|  [ /login ] Cohort Code + Display Name + PIN Auth Gate            |
|  [ /dashboard ] Mentee Single-Week Focus Card (Mon Drop + Sun     |
|        11:59 PM WAT Cutoff), Research Log, Scratchpad, Drawers    |
|  [ /mentor ] Cohort Status Strip, Roll-Call Toggle, Reviews,      |
|        Late-Access Grants, Follow-Ups & 5-Pillar Rubric Scoring   |
|  - Offline Resilience: localStorage Cache + Pending Sync Queue    |
+---------------------------------+---------------------------------+
                                  | REST API (JSON + Bearer Token)
                                  v
+-------------------------------------------------------------------+
|                   BACKEND (Node.js + Express)                     |
|  - Lightweight Cohort + PIN Auth Middleware (MENTEE / MENTOR)     |
|  - Monday Drop & Sunday 11:59 PM WAT Cutoff/Grant Gatekeeper      |
|  - GitHub URL Validator & Duplicate Repo Guard                    |
|  - Automatic 5-Pillar Weighted Score Calculator (40/20/15/15/10)  |
+---------------------------------+---------------------------------+
                                  | SQL (pg / better-sqlite3)
                                  v
+-------------------------------------------------------------------+
|          DATABASE (PostgreSQL on Neon/Supabase | SQLite)          |
|  [cohorts] [users] [weekly_progress] [research_logs]              |
|  [submissions] [late_access_requests] [clarifications]            |
|  [peer_reviews] [attendance_records] [rubric_scores]              |
+-------------------------------------------------------------------+
```

### 5.2 Course Outline Data Schema (`curriculum.json`)
*Contains course outlines, independent research keywords, and project briefs only—no lesson links.*

```json
{
  "programTitle": "Dev8 Full-Stack Mentorship Cohort",
  "timezone": "Africa/Lagos",
  "cutoffRule": "Sunday 23:59:59 WAT",
  "totalWeeks": 8,
  "scoringWeights": {
    "projects": 0.40,
    "understandingAndCodeQuality": 0.20,
    "discussionAndParticipation": 0.15,
    "weeklyTasks": 0.15,
    "collaborationAndProfessionalism": 0.10
  },
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Semantic HTML5, Modern CSS & Responsive Layouts",
      "sandboxMode": "built-in",
      "outlineTopics": [
        {
          "id": "w1-t1",
          "topic": "Semantic HTML5 Document Architecture & Accessibility",
          "researchKeywords": ["semantic HTML landmarks", "ARIA roles basics", "accessible forms"]
        },
        {
          "id": "w1-t2",
          "topic": "CSS Box Model, Flexbox & CSS Grid Systems",
          "researchKeywords": ["CSS flexbox alignment", "CSS grid template areas", "fluid typography clamp()"]
        },
        {
          "id": "w1-t3",
          "topic": "Git & GitHub Workflow + README Documentation",
          "researchKeywords": ["git branch commit push", "clean README structure", "GitHub Pages hosting"]
        }
      ],
      "projectBrief": {
        "title": "Responsive Developer Portfolio & Manifesto Page",
        "description": "Build a semantic, responsive developer landing/portfolio page from scratch using plain HTML and CSS. Document your layout decisions and AI usage in your README and submission notes.",
        "acceptanceCriteria": [
          "Uses semantic HTML landmarks (<header>, <main>, <section>, <footer>)",
          "Responsive across mobile (375px) and desktop (1280px) viewports",
          "Submitted via a valid GitHub repository URL before Sunday 11:59 PM WAT"
        ]
      }
    }
  ]
}
```

### 5.3 Backend REST API Endpoints
All authenticated routes require `Authorization: Bearer <session_token>`.

| Method | Endpoint | Role | Purpose & Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/join` | Public | Join or resume session via `{ cohortCode, displayName, pin, role }`. Returns `{ token, user, cohort }`. |
| `GET` | `/api/public/highlights` | Public | Optional lightweight endpoint serving featured cohort outcomes/success stories for Landing Section 5 (falls back to static `landingContent.json`). |
| `GET` | `/api/weeks` | Both | Returns all 8 outlines with Monday drop dates, Sunday 11:59 PM WAT cutoffs, lock states (`locked_schedule`, `active_open`, `closed_cutoff`, `late_access_granted`, `locked_submission`, `unlocked`), late-access status, and attendance. |
| `PATCH` | `/api/weeks/:weekNumber/progress` | Mentee | Saves researched topic checkmarks & personal notes `{ completedTopicIds, personalNotes }`. |
| `POST` | `/api/weeks/:weekNumber/research-logs` | Mentee | Adds an independent resource/takeaway entry `{ title, url, takeaway }`. |
| `POST` | `/api/weeks/:weekNumber/late-access` | Mentee | Submits reason for non-submission / missed cutoff `{ reason, blockers, requestedUntilWat }`. |
| `PATCH` | `/api/late-access/:id/decision` | Mentor | Mentor grants or declines late submission access `{ decision: "granted" \| "declined", grantedUntilWat, mentorNote }`. |
| `POST` | `/api/weeks/:weekNumber/submit` | Mentee | Submits `{ githubUrl, liveUrl, approachNote, aiReflectionNote }` if within cutoff, granted late access, or revision/follow-up requested. Unlocks Week $N + 1$. |
| `PATCH` | `/api/submissions/:id/review` | Mentor | Sets review state `{ status: "approved" \| "needs_revision" \| "follow_up_requested", mentorFeedback }`. |
| `GET` | `/api/weeks/:weekNumber/clarifications` | Both | Lists clarification tickets for Week $N$ (learner's own tickets + cohort FAQ items; all cohort tickets for Mentor). |
| `POST` | `/api/weeks/:weekNumber/clarifications` | Mentee | Raises *"Need Additional Explanation"* ticket `{ topicId, whatITried, question, codeSnippet }`. |
| `PATCH` | `/api/clarifications/:id/respond` | Mentor | Replies or sets `{ status: "answered" \| "follow_up_requested" \| "resolved", mentorReply, isPinnedFaq }`. |
| `PATCH` | `/api/clarifications/:id/learner-reply` | Mentee | Learner answers a `follow_up_requested` prompt or marks `{ status: "resolved", learnerNote }`. |
| `GET` | `/api/weeks/:weekNumber/gallery` | Both | Returns peer GitHub submissions & reviews for Week $N$ (gated until Mentee submits Week $N$). |
| `POST` | `/api/submissions/:id/peer-review` | Mentee | Posts respectful peer feedback `{ strengthNote, suggestionNote }`. |
| `PATCH` | `/api/weeks/:weekNumber/attendance/:userId` | Mentor | Mentor roll-call toggle `{ status: "present" \| "absent" \| "excused" }`. |
| `GET` | `/api/scores/me` | Mentee | Returns learner's 5-pillar scores, computed weighted total, and mentor evaluation notes. |
| `PUT` | `/api/mentees/:userId/scores` | Mentor | Updates `{ projects, understanding, discussion, weeklyTasks, collaboration, mentorSummary }` and returns computed weighted score. |

### 5.4 Database Schema (PostgreSQL / SQLite Compatible)

```sql
CREATE TABLE cohorts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  start_monday_date DATE NOT NULL,
  timezone VARCHAR(40) DEFAULT 'Africa/Lagos',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
  display_name VARCHAR(80) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(16) NOT NULL CHECK (role IN ('MENTEE', 'MENTOR')),
  session_token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cohort_id, display_name)
);

CREATE TABLE weekly_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
  completed_topic_ids TEXT DEFAULT '[]',
  personal_notes TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, week_number)
);

CREATE TABLE research_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
  title VARCHAR(160) NOT NULL,
  url VARCHAR(500),
  takeaway TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE late_access_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
  reason TEXT NOT NULL,
  blockers TEXT DEFAULT '',
  requested_until_wat TIMESTAMP,
  status VARCHAR(24) DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'declined')),
  granted_until_wat TIMESTAMP,
  mentor_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, week_number)
);

CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
  github_url VARCHAR(255) NOT NULL,
  live_url VARCHAR(255),
  approach_note TEXT NOT NULL,
  ai_reflection_note TEXT NOT NULL,
  status VARCHAR(28) DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'approved', 'needs_revision', 'follow_up_requested')
  ),
  mentor_feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, week_number),
  UNIQUE (cohort_id, week_number, github_url)
);

CREATE TABLE clarifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
  topic_id VARCHAR(32) NOT NULL,
  what_i_tried TEXT NOT NULL,
  question TEXT NOT NULL,
  code_snippet TEXT,
  mentor_reply TEXT,
  learner_followup_note TEXT,
  is_pinned_faq BOOLEAN DEFAULT FALSE,
  status VARCHAR(28) DEFAULT 'open' CHECK (
    status IN ('open', 'answered', 'follow_up_requested', 'resolved')
  ),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE peer_reviews (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  strength_note TEXT NOT NULL,
  suggestion_note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (submission_id, reviewer_id)
);

CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 8),
  status VARCHAR(16) DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'excused')),
  updated_by_mentor_id INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cohort_id, user_id, week_number)
);

CREATE TABLE rubric_scores (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  projects_score NUMERIC(5,2) DEFAULT 0 CHECK (projects_score BETWEEN 0 AND 100),
  understanding_score NUMERIC(5,2) DEFAULT 0 CHECK (understanding_score BETWEEN 0 AND 100),
  discussion_score NUMERIC(5,2) DEFAULT 0 CHECK (discussion_score BETWEEN 0 AND 100),
  weekly_tasks_score NUMERIC(5,2) DEFAULT 0 CHECK (weekly_tasks_score BETWEEN 0 AND 100),
  collaboration_score NUMERIC(5,2) DEFAULT 0 CHECK (collaboration_score BETWEEN 0 AND 100),
  mentor_summary TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Frontend Component Architecture

```text
src/
├── main.jsx
├── App.jsx                          # Client router (/, /login, /dashboard, /mentor), theme & session state
├── utils/
│   ├── scheduleWat.js               # Monday drop & Sunday 11:59 PM WAT cutoff calculator
│   └── scoring.js                   # 5-pillar weighted formula (40/20/15/15/10)
├── styles/
│   ├── tokens.css                   # Quiet UI light/dark CSS variables & spacing scale
│   ├── landing.css                  # Editorial layout styles for the 6-section public landing page
│   └── layout.css                   # Single-card focus workspace & slide-over drawers
├── data/
│   ├── landingContent.json          # Mentorship intro, Mon–Sun steps, Why Us pillars & outcomes
│   └── curriculum.json              # 8-week course outlines & project briefs (no lessons)
├── hooks/
│   ├── useOfflineSync.js            # localStorage drafts/state + queued API sync
│   └── useAuthSession.js            # Cohort + PIN session persistence & role routing
└── components/
    ├── landing/
    │   ├── LandingPage.jsx          # Orchestrates the 6 public landing sections + returning-user bar
    │   ├── PublicNavbar.jsx         # Minimal brand mark, section anchors, Charter & Sign-In CTA
    │   ├── WelcomeHeroSection.jsx   # 1. Welcome page hero + primary/secondary CTAs
    │   ├── MentorshipIntroSection.jsx # 2. Introduce the mentorship & Learn->Ship culture loop
    │   ├── HowItWorksSection.jsx    # 3. Mon outline drop -> Sun 11:59 PM WAT -> Mentor review steps
    │   ├── WhyUsSection.jsx         # 4. Program standards, AI ethics & 5-pillar scoring overview
    │   ├── SuccessStoriesSection.jsx # 5. Mentee reflections & shipped 8-week capstone showcase
    │   └── LandingFooter.jsx        # 6. Footer with quick links, WAT timezone & low-data note
    ├── AuthGatePage.jsx             # /login Cohort Code + Display Name + PIN login
    ├── TopQuietBar.jsx              # Workspace header: Home link, Week badge, Charter, Scorecard, Export .md
    ├── ActiveWeekCard.jsx           # Monday outline, topic checklist, Research Log, cutoff status
    ├── ScratchpadPanel.jsx          # Collapsible HTML/CSS/JS srcDoc sandbox (Weeks 1–4)
    ├── GitHubSubmitModal.jsx        # Repo URL + Approach + AI Reflection form (unlocks next week)
    ├── LateAccessModal.jsx          # Non-submission reason form & mentor access grant status
    ├── ClarificationDrawer.jsx      # Raise tickets (with code snippet) & handle follow-ups
    ├── PeerGalleryDrawer.jsx        # Post-submission cohort repo gallery & peer feedback
    ├── ProgramCharterDrawer.jsx     # Pinned 8 Program Rules & 5-Pillar Scorecard breakdown
    ├── WeekMapDrawer.jsx            # 8-week timeline showing Locked / Active / Cutoff / Approved
    └── MentorDashboardView.jsx      # /mentor Cohort Status Strip, Roll-Call Toggle, Grants & Reviews
```

---

## 7. Edge Cases, Error Handling & Offline Resilience

1. **Public Landing vs. Returning Learner Navigation:**
   * First-time visitors always land on `/` (the 6-section Welcome & Mentorship overview) rather than an abrupt login wall or locked dashboard.
   * Returning learners with an active token in `localStorage` see an immediate top banner on `/` (*"Continue to Week X →"*) and are routed straight to `/dashboard` (or `/mentor`) upon signing in.
2. **Sunday 11:59 PM WAT Cutoff Enforcement & Late Access Grant:**
   * Server validates submission timestamps against `Africa/Lagos` (`WAT`). Once past Sunday `23:59:59 WAT`, `POST /api/weeks/:weekNumber/submit` returns `403 Cutoff Closed` unless `late_access_requests.status = 'granted'` (and within `granted_until_wat` if set) or the submission is in `'needs_revision'` / `'follow_up_requested'` state.
3. **GitHub URL Validation & Anti-Copy Guard (Rule #4):**
   * Enforces `^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$` and rejects duplicate repository URLs for the same cohort and week with a clear message: *"This GitHub repository URL has already been submitted in this cohort for this week. Every project must represent your own work."*
4. **Follow-Up & Revision Loop Integrity:**
   * If a mentor sets `follow_up_requested` or `needs_revision`, the learner sees clear guidance on what to clarify or fix and can submit an updated response/repository without losing previous notes.
5. **Backend Cold-Start & Offline Draft Resilience:**
   * Renders `landingContent.json`, `curriculum.json`, and cached `localStorage` data immediately while showing a non-blocking `"Syncing..."` status indicator. Auto-saves topic checkmarks, Research Log entries, clarification drafts, and scratchpad code locally before flushing queued requests to the API.
6. **Peer Gallery Gating (Rule #2 & #4):**
   * `GET /api/weeks/:weekNumber/gallery` returns `403 Forbidden` until the learner submits their own GitHub repository for Week $N$.

---

## 8. Development Milestones & Git Commit Roadmap

| Commit # | Milestone Title | Key Deliverables & Verification |
| :--- | :--- | :--- |
| **Commit 1** | `chore: initialize quiet-ui react/vite shell, routing, wat utils, and data files` | Set up Vite React app, client routing (`/`, `/login`, `/dashboard`, `/mentor`), `tokens.css` (light/dark), `landingContent.json`, `curriculum.json`, and `scheduleWat.js`. |
| **Commit 2** | `feat: build 6-section public learning landing page and charter drawer` | Implement `LandingPage.jsx` (`WelcomeHeroSection`, `MentorshipIntroSection`, `HowItWorksSection`, `WhyUsSection`, `SuccessStoriesSection`, `LandingFooter`), returning-session banner, and `ProgramCharterDrawer.jsx`. |
| **Commit 3** | `feat: build active week card, research log, and html/css/js scratchpad` | Implement `/dashboard` `ActiveWeekCard.jsx`, `WeekMapDrawer.jsx`, independent `"What I Found & Learned"` log, and sandboxed `<iframe srcDoc>` scratchpad for Weeks 1–4. |
| **Commit 4** | `feat: scaffold express api, postgres/sqlite schema, and cohort pin auth` | Create Express server, SQL schema for all 10 tables, `/api/auth/join`, and `/api/weeks` with Monday drop & Sunday 11:59 PM WAT cutoff logic. |
| **Commit 5** | `feat: implement github submission gate, late-access requests, and mentor grants` | Build `/api/weeks/:weekNumber/submit`, duplicate repo check, Approach + AI reflection fields, `LateAccessModal.jsx`, and mentor late-access approval flow. |
| **Commit 6** | `feat: add clarification tickets with code context and mentor follow-up loop` | Implement `ClarificationDrawer.jsx`, optional code/sandbox snippet support, mentor `follow_up_requested` state, and learner follow-up replies. |
| **Commit 7** | `feat: build peer gallery, mentor roll-call attendance, cohort strip, and 5-pillar scoring` | Add gated `PeerGalleryDrawer.jsx`, `MentorDashboardView.jsx` (`/mentor`) with roll-call toggles and Cohort Status Strip, weighted `40/20/15/15/10` scoring, and `.md` export. |
| **Commit 8** | `feat: add offline sync queue, seed script, and free-tier deployment configs` | Implement `useOfflineSync.js` for cold-start/offline resilience, demo cohort seed data, and Vercel + Render/Neon configuration files. |