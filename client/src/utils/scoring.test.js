import { describe, it, expect } from "vitest";
import { computeWeightedScore } from "./scoring";

describe("scoring", () => {
  it("computes 45/25/15/15 weighted total", () => {
    const result = computeWeightedScore({ projects: 100, understanding: 80, discussion: 70, weeklyTasks: 90 });
    expect(result.total).toBe(89);
  });

  it("clamps out-of-range scores", () => {
    const result = computeWeightedScore({ projects: 120, understanding: -10, discussion: 50, weeklyTasks: 50 });
    expect(result.projects).toBe(100);
    expect(result.understanding).toBe(0);
  });
});
