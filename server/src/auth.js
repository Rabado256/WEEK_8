import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { db } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev8-dev-secret";

export function signSession(user) {
  return jwt.sign({ sub: user.id, role: user.role, cohortId: user.cohort_id, token: user.session_token }, JWT_SECRET, { expiresIn: "30d" });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT id, cohort_id, display_name, role, session_token FROM users WHERE id = ?").get(payload.sub);
    if (!user || user.session_token !== payload.token) return res.status(401).json({ error: "Invalid session" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export async function joinOrCreate({ cohortCode, displayName, pin, role }) {
  const cohort = db.prepare("SELECT * FROM cohorts WHERE code = ?").get(String(cohortCode || "").trim().toUpperCase());
  if (!cohort) throw Object.assign(new Error("Invalid cohort code"), { status: 404 });
  const name = String(displayName || "").trim();
  if (!name || String(pin || "").length < 4) throw Object.assign(new Error("Display name and 4+ digit PIN required"), { status: 400 });
  const existing = db.prepare("SELECT * FROM users WHERE cohort_id = ? AND display_name = ?").get(cohort.id, name);
  if (existing) {
    const ok = await bcrypt.compare(String(pin), existing.pin_hash);
    if (!ok) throw Object.assign(new Error("Invalid PIN"), { status: 401 });
    if (existing.role !== role) throw Object.assign(new Error("Role does not match this account"), { status: 403 });
    return { user: existing, cohort };
  }
  if (role === "MENTOR") throw Object.assign(new Error("Mentor account must be pre-created"), { status: 403 });
  const pinHash = await bcrypt.hash(String(pin), 10);
  const sessionToken = uuid();
  const info = db.prepare("INSERT INTO users (cohort_id, display_name, pin_hash, role, session_token) VALUES (?,?,?,?,?)")
    .run(cohort.id, name, pinHash, role, sessionToken);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  return { user, cohort };
}
