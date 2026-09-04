import { describe, it, expect } from "vitest";
import { splitLeaveRange } from "@/lib/leave-store";
import { calculateBusinessDays } from "@/lib/mock-data";

describe("calculateBusinessDays", () => {
  it("counts a full Mon-Fri week as 5 days", () => {
    expect(calculateBusinessDays("2026-09-07", "2026-09-11")).toBe(5);
  });

  it("excludes weekends when the range spans them", () => {
    expect(calculateBusinessDays("2026-09-04", "2026-09-11")).toBe(6);
  });

  it("returns 1 for a single weekday", () => {
    expect(calculateBusinessDays("2026-09-07", "2026-09-07")).toBe(1);
  });

  it("counts only the weekday portion when the range ends on a weekend", () => {
    expect(calculateBusinessDays("2026-09-11", "2026-09-13")).toBe(1);
  });

  it("returns 0 when both dates are on the weekend", () => {
    expect(calculateBusinessDays("2026-09-12", "2026-09-13")).toBe(0);
  });
});

describe("splitLeaveRange", () => {
  it("returns no split when the request fits within the remaining balance", () => {
    const result = splitLeaveRange({
      startDate: "2026-09-07",
      endDate: "2026-09-11",
      remaining: 10,
    });
    expect(result).toEqual({ paid: null, unpaid: null });
  });

  it("files the whole request as unpaid when remaining balance is zero", () => {
    const result = splitLeaveRange({
      startDate: "2026-09-07",
      endDate: "2026-09-11",
      remaining: 0,
    });
    expect(result).toEqual({
      paid: null,
      unpaid: { start: "2026-09-07", end: "2026-09-11" },
    });
  });

  it("splits across a weekend boundary at the paid-day cutoff", () => {
    const result = splitLeaveRange({
      startDate: "2026-09-07",
      endDate: "2026-09-18",
      remaining: 5,
    });
    expect(result).toEqual({
      paid: { start: "2026-09-07", end: "2026-09-11" },
      unpaid: { start: "2026-09-14", end: "2026-09-18" },
    });
  });

  it("uses only the whole-day floor of the remaining balance", () => {
    const result = splitLeaveRange({
      startDate: "2026-09-07",
      endDate: "2026-09-09",
      remaining: 2.5,
    });
    expect(result).toEqual({
      paid: { start: "2026-09-07", end: "2026-09-08" },
      unpaid: { start: "2026-09-09", end: "2026-09-09" },
    });
  });

  it("rounds a negative balance up to zero (fully unpaid)", () => {
    const result = splitLeaveRange({
      startDate: "2026-09-07",
      endDate: "2026-09-11",
      remaining: -3,
    });
    expect(result).toEqual({
      paid: null,
      unpaid: { start: "2026-09-07", end: "2026-09-11" },
    });
  });

  it("keeps a one-day unpaid remainder when paid days run out mid-request", () => {
    const result = splitLeaveRange({
      startDate: "2026-09-07",
      endDate: "2026-09-09",
      remaining: 2,
    });
    expect(result).toEqual({
      paid: { start: "2026-09-07", end: "2026-09-08" },
      unpaid: { start: "2026-09-09", end: "2026-09-09" },
    });
  });
});
