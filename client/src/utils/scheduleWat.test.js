import { describe, it, expect } from "vitest";
import { getWeekLockState, getWeekWindow } from "./scheduleWat";

describe("scheduleWat", () => {
  it("computes Sunday 23:59:59 WAT cutoff", () => {
    const { cutoffUtc } = getWeekWindow("2026-11-16", 1);
    expect(cutoffUtc.toISOString()).toBe("2026-11-22T22:59:59.000Z");
  });

  it("locks before Monday drop", () => {
    const state = getWeekLockState({ now: new Date("2026-11-15T22:59:59Z"), startMondayDate: "2026-11-16", weekNumber: 1, hasSubmission: false });
    expect(state).toBe("locked_schedule");
  });

  it("is open during week", () => {
    const state = getWeekLockState({ now: new Date("2026-11-18T12:00:00Z"), startMondayDate: "2026-11-16", weekNumber: 1, hasSubmission: false });
    expect(state).toBe("active_open");
  });

  it("closes after cutoff without grant/submission", () => {
    const state = getWeekLockState({ now: new Date("2026-11-22T23:00:00Z"), startMondayDate: "2026-11-16", weekNumber: 1, hasSubmission: false });
    expect(state).toBe("closed_cutoff");
  });

  it("allows late access when granted", () => {
    const state = getWeekLockState({ now: new Date("2026-11-23T10:00:00Z"), startMondayDate: "2026-11-16", weekNumber: 1, hasSubmission: false, lateAccess: { status: "granted", grantedUntilWat: "2026-11-24T22:59:59.000Z" } });
    expect(state).toBe("late_access_granted");
  });
});
