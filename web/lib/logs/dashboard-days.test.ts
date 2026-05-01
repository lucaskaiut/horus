import { describe, expect, it } from "vitest";

import { clampDashboardDays } from "./dashboard-days";

describe("clampDashboardDays", () => {
  it("clamp entre 7 e 90", () => {
    expect(clampDashboardDays(14)).toBe(14);
    expect(clampDashboardDays("30")).toBe(30);
    expect(clampDashboardDays(200)).toBe(90);
    expect(clampDashboardDays(1)).toBe(7);
  });

  it("usa fallback quando inválido", () => {
    expect(clampDashboardDays("oops", 30)).toBe(30);
  });
});
