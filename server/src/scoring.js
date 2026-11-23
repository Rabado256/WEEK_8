export const WEIGHTS = { projects: 0.45, understanding: 0.25, discussion: 0.15, weeklyTasks: 0.15 };

export function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function computeWeightedScore(scores = {}) {
  const normalized = {
    projects: clampScore(scores.projects_score ?? scores.projects),
    understanding: clampScore(scores.understanding_score ?? scores.understanding),
    discussion: clampScore(scores.discussion_score ?? scores.discussion),
    weeklyTasks: clampScore(scores.weekly_tasks_score ?? scores.weeklyTasks),
  };
  const total =
    normalized.projects * WEIGHTS.projects +
    normalized.understanding * WEIGHTS.understanding +
    normalized.discussion * WEIGHTS.discussion +
    normalized.weeklyTasks * WEIGHTS.weeklyTasks;
  return { ...normalized, total: Math.round(total * 100) / 100 };
}
