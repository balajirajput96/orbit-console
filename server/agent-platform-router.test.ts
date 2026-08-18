import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createAgentTask: vi.fn(),
  getRepositoryByFullName: vi.fn(),
  listAgentTasks: vi.fn(),
  listAuditEntries: vi.fn(),
  listGitHubWorkflowHealth: vi.fn(),
  listIntegrationStates: vi.fn(),
  listRepositoryInventory: vi.fn(),
  logAuditEntry: vi.fn(),
  updateAgentTaskStatus: vi.fn(),
}));

const llmMocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
const imageMocks = vi.hoisted(() => ({ generateImage: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/llm", () => llmMocks);
vi.mock("./_core/imageGeneration", () => imageMocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "orbit-owner",
    email: "owner@example.com",
    name: "Orbit Owner",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Orbit protected router boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createAgentTask.mockResolvedValue(91);
    dbMocks.logAuditEntry.mockResolvedValue(undefined);
  });

  it("creates only a review-gated task draft and records an audit entry", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.tasks.createDraft({ title: "Review orbit boundary", brief: "Confirm the protected route and database ownership checks.", type: "analysis" })).resolves.toEqual({ id: 91 });
    expect(dbMocks.createAgentTask).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 42,
      status: "draft",
      riskLevel: "review_required",
      type: "analysis",
    }));
    expect(dbMocks.logAuditEntry).toHaveBeenCalledWith(42, "task", "Draft task created", expect.stringContaining("Review orbit boundary"));
  });

  it("rejects malformed task requests before writing to the database", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.tasks.createDraft({ title: "No", brief: "Short title should be rejected before a database write.", type: "code" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.createAgentTask).not.toHaveBeenCalled();
  });

  it("returns persisted integration states instead of static samples", async () => {
    dbMocks.listIntegrationStates.mockResolvedValue([{ integrationKey: "github", label: "GitHub", status: "connected", mode: "read-first", detail: "Inventory available." }]);
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.control.integrations()).resolves.toEqual([{ integrationKey: "github", label: "GitHub", status: "connected", mode: "read-first", detail: "Inventory available." }]);
    expect(dbMocks.listIntegrationStates).toHaveBeenCalledOnce();
  });

  it("returns persisted GitHub Actions health records without exposing credentials", async () => {
    dbMocks.listGitHubWorkflowHealth.mockResolvedValue([{ fullName: "balajirajput96/orbit-console", workflowName: "CI", health: "healthy", status: "completed", conclusion: "success" }]);
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.control.githubHealth()).resolves.toEqual([{ fullName: "balajirajput96/orbit-console", workflowName: "CI", health: "healthy", status: "completed", conclusion: "success" }]);
    expect(dbMocks.listGitHubWorkflowHealth).toHaveBeenCalledOnce();
  });

  it("analyzes only stored repository metadata and writes a read-only audit record", async () => {
    dbMocks.getRepositoryByFullName.mockResolvedValue({ fullName: "balajirajput96/accelerate", description: "Agent SDK", visibility: "public", primaryLanguage: "TypeScript", observedAt: new Date() });
    llmMocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "Learn from the metadata without reading or changing code." } }] });
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.control.analyzeRepository({ fullName: "balajirajput96/accelerate" })).resolves.toEqual({ repository: "balajirajput96/accelerate", analysis: "Learn from the metadata without reading or changing code." });
    expect(llmMocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ messages: expect.arrayContaining([expect.objectContaining({ role: "user" })]) }));
    expect(dbMocks.logAuditEntry).toHaveBeenCalledWith(42, "repository", "Read-only metadata analysis", expect.stringContaining("accelerate"));
  });

  it("generates private AI responses and assets with corresponding audit records", async () => {
    llmMocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "A safe project plan." } }] });
    imageMocks.generateImage.mockResolvedValue({ url: "https://assets.example/orbit.png" });
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.agent.chat({ messages: [{ role: "user", content: "Draft a safe plan." }] })).resolves.toEqual({ answer: "A safe project plan." });
    await expect(caller.agent.generateImage({ prompt: "A professional Orbit interface sketch" })).resolves.toEqual({ url: "https://assets.example/orbit.png" });
    expect(dbMocks.logAuditEntry).toHaveBeenCalledWith(42, "ai", "Assistant response created", expect.any(String));
    expect(dbMocks.logAuditEntry).toHaveBeenCalledWith(42, "asset", "Image generated", expect.any(String));
  });

  it("accepts only HTTPS n8n candidates and records them as review drafts", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.n8n.createConnectionReview({ candidateUrl: "http://localhost:5678" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.n8n.createConnectionReview({ candidateUrl: "https://n8n.example.com" })).resolves.toEqual({ id: 91 });
    expect(dbMocks.createAgentTask).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 42,
      title: "Review n8n endpoint registration",
      status: "draft",
      riskLevel: "review_required",
    }));
    expect(dbMocks.logAuditEntry).toHaveBeenCalledWith(42, "n8n", "Endpoint review draft created", expect.any(String));
  });
});
