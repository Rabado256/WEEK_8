export const WEIGHTS = {
  projects: 0.4,
  understanding: 0.2,
  discussion: 0.15,
  weeklyTasks: 0.15,
  collaboration: 0.1,
};

export function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function computeWeightedScore(scores = {}) {
  const p = clampScore(scores.projects);
  const u = clampScore(scores.understanding);
  const d = clampScore(scores.discussion);
  const t = clampScore(scores.weeklyTasks);
  const c = clampScore(scores.collaboration);
  const total = p * WEIGHTS.projects + u * WEIGHTS.understanding + d * WEIGHTS.discussion + t * WEIGHTS.weeklyTasks + c * WEIGHTS.collaboration;
  return { projects: p, understanding: u, discussion: d, weeklyTasks: t, collaboration: c, total: Math.round(total * 100) / 100 };
}
