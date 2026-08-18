import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getAutomationScheduleByKey: vi.fn(),
  getPrimaryAdminUser: vi.fn(),
  listRepositoryInventory: vi.fn(),
  logAuditEntry: vi.fn(),
  upsertGitHubWorkflowHealth: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({ authenticateRequest: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/sdk", () => ({ sdk: authMocks }));

import { GITHUB_HEALTH_SCHEDULE_KEY, handleGitHubActionsHealthSchedule } from "./githubMonitoring";

describe("GitHub Actions scheduled scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "cron-health-job" });
    dbMocks.getAutomationScheduleByKey.mockResolvedValue({ cronTaskUid: "cron-health-job", isEnabled: 1 });
    dbMocks.getPrimaryAdminUser.mockResolvedValue({ id: 42 });
    dbMocks.listRepositoryInventory.mockResolvedValue([]);
    dbMocks.logAuditEntry.mockResolvedValue(undefined);
  });

  it("accepts the registered cron identity and records a completion audit entry for the persisted administrator", async () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handleGitHubActionsHealthSchedule({} as never, response as never);

    expect(dbMocks.getAutomationScheduleByKey).toHaveBeenCalledWith(GITHUB_HEALTH_SCHEDULE_KEY);
    expect(dbMocks.getPrimaryAdminUser).toHaveBeenCalledOnce();
    expect(dbMocks.logAuditEntry).toHaveBeenCalledWith(42, "github", "Daily Actions health scan completed", expect.stringContaining("Scanned 0 repositories"));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, scanned: 0 }));
  });
});
