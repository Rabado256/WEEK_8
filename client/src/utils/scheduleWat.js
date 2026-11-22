const WAT_OFFSET_MS = 60 * 60 * 1000;

function toWatParts(date = new Date()) {
  const wat = new Date(date.getTime() + WAT_OFFSET_MS);
  return {
    year: wat.getUTCFullYear(),
    month: wat.getUTCMonth(),
    day: wat.getUTCDate(),
    hour: wat.getUTCHours(),
    minute: wat.getUTCMinutes(),
    second: wat.getUTCSeconds(),
    dayOfWeek: wat.getUTCDay(),
  };
}

function watDateToUtc(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour - 1, minute, second));
}

export function getWeekWindow(startMondayDate, weekNumber) {
  const [y, m, d] = startMondayDate.split("-").map(Number);
  const startUtc = watDateToUtc(y, m - 1, d + (weekNumber - 1) * 7, 0, 0, 0);
  const cutoffUtc = watDateToUtc(y, m - 1, d + (weekNumber - 1) * 7 + 6, 23, 59, 59);
  return { startUtc, cutoffUtc };
}

export function getWeekLockState({ now = new Date(), startMondayDate, weekNumber, hasSubmission, lateAccess }) {
  const { startUtc, cutoffUtc } = getWeekWindow(startMondayDate, weekNumber);
  if (now < startUtc) return "locked_schedule";
  const granted = lateAccess?.status === "granted" && (!lateAccess.grantedUntilWat || now <= new Date(lateAccess.grantedUntilWat));
  if (now <= cutoffUtc) return "active_open";
  if (granted) return "late_access_granted";
  if (hasSubmission) return "unlocked";
  return "closed_cutoff";
}

export function formatWat(date = new Date()) {
  const p = toWatParts(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)} WAT`;
}

export const WAT_TZ = "Africa/Lagos";
