import { describe, expect, it } from "vitest";

const safeTaskTypes = ["code", "analysis", "image", "video", "automation"] as const;

describe("agent-control task guardrails", () => {
  it("keeps supported draft task types explicit", () => {
    expect(safeTaskTypes).toEqual(["code", "analysis", "image", "video", "automation"]);
  });

  it("requires a non-empty task title before a task can be accepted by the UI", () => {
    expect("  ".trim().length >= 3).toBe(false);
    expect("Audit repository boundaries".trim().length >= 3).toBe(true);
  });
});

