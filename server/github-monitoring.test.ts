import { describe, expect, it } from "vitest";
import { classifyGitHubWorkflowRun, isStaleGitHubWorkflowRun, truncateGitHubField } from "./githubMonitoring";

describe("GitHub Actions health classification", () => {
  it("classifies terminal and in-progress workflow runs without making network calls", () => {
    const observedAt = new Date("2026-08-18T00:00:00Z");
    expect(classifyGitHubWorkflowRun({ status: "completed", conclusion: "success", updated_at: "2026-08-17T00:00:00Z" }, observedAt)).toBe("healthy");
    expect(classifyGitHubWorkflowRun({ status: "queued", conclusion: null, updated_at: "2026-08-17T00:00:00Z" }, observedAt)).toBe("pending");
    expect(classifyGitHubWorkflowRun({ status: "completed", conclusion: "failure", updated_at: "2026-08-17T00:00:00Z" }, observedAt)).toBe("failed");
    expect(classifyGitHubWorkflowRun({ status: "completed", conclusion: "cancelled", updated_at: "2026-08-17T00:00:00Z" }, observedAt)).toBe("unknown");
    expect(classifyGitHubWorkflowRun(null)).toBe("unknown");
  });

  it("does not report historical completed runs as current workflow failures", () => {
    const observedAt = new Date("2026-08-18T00:00:00Z");
    const historicalRun = { status: "completed", conclusion: "failure", updated_at: "2026-04-08T08:01:17Z" };

    expect(isStaleGitHubWorkflowRun(historicalRun, observedAt)).toBe(true);
    expect(classifyGitHubWorkflowRun(historicalRun, observedAt)).toBe("unknown");
  });

  it("bounds external workflow metadata to the persisted schema field limits", () => {
    const longName = "x".repeat(300);
    const normalized = truncateGitHubField(longName, 240);

    expect(normalized).toHaveLength(240);
    expect(normalized).toMatch(/…$/);
    expect(truncateGitHubField(null, 240)).toBeNull();
  });
});
