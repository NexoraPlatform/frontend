import { describe, expect, it } from "vitest";

import {
  extractValidationMessage,
  formatDateTime,
  formatMoney,
  getToneClass,
  humanizeCode,
  normalizeLines,
} from "@/components/admin/admin-contracts-console/_lib/admin-contracts-console-helpers";

describe("admin-contracts-console helpers", () => {
  it("humanizes status and reason codes", () => {
    expect(humanizeCode("pending_review")).toBe("Pending Review");
    expect(humanizeCode("manual-review-needed")).toBe("Manual Review Needed");
  });

  it("maps semantic states to tone classes", () => {
    expect(getToneClass("approved")).toContain("emerald");
    expect(getToneClass("blocked")).toContain("red");
    expect(getToneClass("pending_review")).toContain("amber");
    expect(getToneClass("unknown")).toContain("slate");
  });

  it("formats datetimes for the selected locale", () => {
    expect(formatDateTime("2026-04-02T10:30:00Z", "en")).toContain("2026");
    expect(formatDateTime(null, "en")).toBeNull();
    expect(formatDateTime("not-a-date", "en")).toBeNull();
  });

  it("formats money safely", () => {
    expect(formatMoney(1234.5, "EUR", "en")).toContain("1,234.50");
    expect(formatMoney(null, "EUR", "en")).toBeNull();
  });

  it("extracts direct and nested validation messages", () => {
    expect(extractValidationMessage({ message: "Top level message" })).toBe(
      "Top level message"
    );
    expect(
      extractValidationMessage({
        errors: {
          body: ["First nested error"],
        },
      })
    ).toBe("First nested error");
    expect(extractValidationMessage({ errors: { body: [] } })).toBeNull();
  });

  it("normalizes multiline requested changes", () => {
    expect(normalizeLines(" first\n\nsecond \n   \nthird")).toEqual([
      "first",
      "second",
      "third",
    ]);
  });
});
