export const WEIGHTS = { projects: 0.4, understanding: 0.2, discussion: 0.15, weeklyTasks: 0.15, collaboration: 0.1 };

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
    collaboration: clampScore(scores.collaboration_score ?? scores.collaboration),
  };
  const total =
    normalized.projects * WEIGHTS.projects +
    normalized.understanding * WEIGHTS.understanding +
    normalized.discussion * WEIGHTS.discussion +
    normalized.weeklyTasks * WEIGHTS.weeklyTasks +
    normalized.collaboration * WEIGHTS.collaboration;
  return { ...normalized, total: Math.round(total * 100) / 100 };
}
