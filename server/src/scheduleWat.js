const WAT_OFFSET_MS = 60 * 60 * 1000;

export function watDateToUtc(year, monthIndex, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, monthIndex, day, hour - 1, minute, second));
}

export function getWeekWindow(startMondayDate, weekNumber) {
  const [y, m, d] = startMondayDate.split("-").map(Number);
  const offsetDays = (weekNumber - 1) * 7;
  const startUtc = watDateToUtc(y, m - 1, d + offsetDays, 0, 0, 0);
  const cutoffUtc = watDateToUtc(y, m - 1, d + offsetDays + 6, 23, 59, 59);
  return { startUtc, cutoffUtc };
}

export function getWeekLockState({ now = new Date(), startMondayDate, weekNumber, hasSubmission = false, lateAccess = null, reviewStatus = null }) {
  const { startUtc, cutoffUtc } = getWeekWindow(startMondayDate, weekNumber);
  if (now < startUtc) return "locked_schedule";
  const granted = lateAccess?.status === "granted" && (!lateAccess.granted_until_wat || now <= new Date(lateAccess.granted_until_wat));
  if (now <= cutoffUtc) return hasSubmission ? "active_open" : "active_open";
  if (granted) return "late_access_granted";
  if (["needs_revision", "follow_up_requested"].includes(reviewStatus)) return "active_open";
  if (hasSubmission) return "unlocked";
  return "closed_cutoff";
}
