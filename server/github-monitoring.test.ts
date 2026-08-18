import { describe, expect, it } from "vitest";
import { classifyGitHubWorkflowRun, truncateGitHubField } from "./githubMonitoring";

describe("GitHub Actions health classification", () => {
  it("classifies terminal and in-progress workflow runs without making network calls", () => {
    expect(classifyGitHubWorkflowRun({ status: "completed", conclusion: "success" })).toBe("healthy");
    expect(classifyGitHubWorkflowRun({ status: "queued", conclusion: null })).toBe("pending");
    expect(classifyGitHubWorkflowRun({ status: "completed", conclusion: "failure" })).toBe("failed");
    expect(classifyGitHubWorkflowRun(null)).toBe("unknown");
  });

  it("bounds external workflow metadata to the persisted schema field limits", () => {
    const longName = "x".repeat(300);
    const normalized = truncateGitHubField(longName, 240);

    expect(normalized).toHaveLength(240);
    expect(normalized).toMatch(/…$/);
    expect(truncateGitHubField(null, 240)).toBeNull();
  });
});
