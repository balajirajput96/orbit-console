import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import {
  getAutomationScheduleByKey,
  getPrimaryAdminUser,
  listRepositoryInventory,
  logAuditEntry,
  upsertGitHubWorkflowHealth,
} from "./db";

export const GITHUB_HEALTH_SCHEDULE_KEY = "github-actions-daily";

type GitHubWorkflowRun = {
  id: number;
  name: string | null;
  status: string;
  conclusion: string | null;
  head_branch: string | null;
  updated_at: string | null;
  html_url: string | null;
};

type Repository = Awaited<ReturnType<typeof listRepositoryInventory>>[number];

type GitHubHealthRecord = {
  fullName: string;
  workflowName: string | null;
  runId: string | null;
  branch: string | null;
  status: string;
  conclusion: string | null;
  health: GitHubHealthState;
  sourceUrl: string;
  runUpdatedAt: Date | null;
  observedAt: Date;
};

export type GitHubHealthState = "healthy" | "pending" | "failed" | "unavailable" | "unknown";

export const GITHUB_WORKFLOW_STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export function truncateGitHubField(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

export function isStaleGitHubWorkflowRun(
  run: Pick<GitHubWorkflowRun, "updated_at"> | null,
  observedAt: Date = new Date()
): boolean {
  if (!run?.updated_at) return false;
  const updatedAt = new Date(run.updated_at);
  if (Number.isNaN(updatedAt.getTime())) return false;
  return observedAt.getTime() - updatedAt.getTime() > GITHUB_WORKFLOW_STALE_AFTER_MS;
}

export function classifyGitHubWorkflowRun(run: Pick<GitHubWorkflowRun, "status" | "conclusion" | "updated_at"> | null, observedAt: Date = new Date()): GitHubHealthState {
  if (!run) return "unknown";
  if (isStaleGitHubWorkflowRun(run, observedAt)) return "unknown";
  if (run.status !== "completed") return "pending";
  if (run.conclusion === "cancelled") return "unknown";
  if (run.conclusion === "success" || run.conclusion === "skipped" || run.conclusion === "neutral") return "healthy";
  if (["failure", "timed_out", "action_required", "startup_failure", "stale"].includes(run.conclusion ?? "")) return "failed";
  return "unknown";
}

async function fetchRepositoryHealth(repository: Repository, observedAt: Date): Promise<GitHubHealthRecord> {
  const apiUrl = `https://api.github.com/repos/${repository.fullName}/actions/runs?per_page=1`;
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${ENV.githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return {
        fullName: repository.fullName,
        workflowName: null,
        runId: null,
        branch: null,
        status: `http_${response.status}`,
        conclusion: null,
        health: "unavailable",
        sourceUrl: repository.sourceUrl,
        runUpdatedAt: null,
        observedAt,
      };
    }

    const payload = (await response.json()) as { workflow_runs?: GitHubWorkflowRun[] };
    const run = payload.workflow_runs?.[0] ?? null;
    return {
      fullName: repository.fullName,
      workflowName: truncateGitHubField(run?.name, 240),
      runId: run ? String(run.id) : null,
      branch: truncateGitHubField(run?.head_branch, 240),
      status: run?.status ?? "no_runs",
      conclusion: truncateGitHubField(run?.conclusion, 80),
      health: classifyGitHubWorkflowRun(run),
      sourceUrl: truncateGitHubField(run?.html_url ?? repository.sourceUrl, 512) ?? repository.sourceUrl,
      runUpdatedAt: run?.updated_at ? new Date(run.updated_at) : null,
      observedAt,
    };
  } catch {
    return {
      fullName: repository.fullName,
      workflowName: null,
      runId: null,
      branch: null,
      status: "network_error",
      conclusion: null,
      health: "unavailable",
      sourceUrl: repository.sourceUrl,
      runUpdatedAt: null,
      observedAt,
    };
  }
}

export async function scanGitHubActionsHealth() {
  if (!ENV.githubToken) throw new Error("GITHUB_TOKEN is not configured for the scheduled GitHub health scan.");
  const repositories = await listRepositoryInventory();
  const observedAt = new Date();
  const summary: Record<GitHubHealthState, number> = { healthy: 0, pending: 0, failed: 0, unavailable: 0, unknown: 0 };
  const batchSize = 8;

  for (let offset = 0; offset < repositories.length; offset += batchSize) {
    const records = await Promise.all(repositories.slice(offset, offset + batchSize).map((repository) => fetchRepositoryHealth(repository, observedAt)));
    for (const record of records) {
      await upsertGitHubWorkflowHealth(record);
      summary[record.health] += 1;
    }
  }

  return { scanned: repositories.length, summary, observedAt };
}

export async function handleGitHubActionsHealthSchedule(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });

    const schedule = await getAutomationScheduleByKey(GITHUB_HEALTH_SCHEDULE_KEY);
    if (!schedule || schedule.cronTaskUid !== user.taskUid || schedule.isEnabled !== 1) {
      return res.json({ ok: true, skipped: "unknown-or-disabled-schedule" });
    }

    const result = await scanGitHubActionsHealth();
    const owner = await getPrimaryAdminUser();
    if (owner) {
      await logAuditEntry(owner.id, "github", "Daily Actions health scan completed", `Scanned ${result.scanned} repositories: ${result.summary.failed} failed, ${result.summary.pending} pending, ${result.summary.unavailable} unavailable.`);
    }
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({
      error: "github-actions-health-scan-failed",
      detail: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}
