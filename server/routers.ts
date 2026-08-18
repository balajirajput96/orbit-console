import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAgentTask, getRepositoryByFullName, listAgentTasks, listAuditEntries, listGitHubWorkflowHealth, listIntegrationStates, listRepositoryInventory, logAuditEntry, updateAgentTaskStatus } from "./db";

const taskInput = z.object({
  title: z.string().trim().min(3).max(240),
  brief: z.string().trim().min(8).max(4000),
  type: z.enum(["code", "analysis", "image", "video", "automation"]),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  agent: router({
    chat: protectedProcedure
      .input(z.object({ messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().min(1).max(8000) })).min(1).max(24) }))
      .mutation(async ({ ctx, input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are Orbit, a professional AI-agent control assistant. Help users plan code, automation, image, and video work. You may analyze and draft, but never claim to execute external changes, deploy code, send messages, change account permissions, expose credentials, or activate automations without an explicit verified tool result. Keep answers concise and operational.",
            },
            ...input.messages,
          ],
        });
        const content = response.choices?.[0]?.message?.content;
        const answer = typeof content === "string" ? content : "I could not produce a text response.";
        await logAuditEntry(ctx.user.id, "ai", "Assistant response created", "A private control-center chat response was generated.");
        return { answer };
      }),
    generateImage: protectedProcedure
      .input(z.object({ prompt: z.string().trim().min(5).max(1200) }))
      .mutation(async ({ ctx, input }) => {
        const image = await generateImage({ prompt: input.prompt });
        await logAuditEntry(ctx.user.id, "asset", "Image generated", "An image asset was generated from a user-provided prompt.");
        return image;
      }),
  }),
  tasks: router({
    list: protectedProcedure.query(({ ctx }) => listAgentTasks(ctx.user.id)),
    createDraft: protectedProcedure.input(taskInput).mutation(async ({ ctx, input }) => {
      const id = await createAgentTask({ ownerId: ctx.user.id, ...input, status: "draft", riskLevel: "review_required" });
      await logAuditEntry(ctx.user.id, "task", "Draft task created", `Created draft ${input.type} task: ${input.title}`);
      return { id };
    }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "queued", "blocked", "completed"]) }))
      .mutation(async ({ ctx, input }) => {
        const result = await updateAgentTaskStatus(ctx.user.id, input.id, input.status);
        await logAuditEntry(ctx.user.id, "task", "Task status updated", `Updated task ${input.id} to ${input.status}.`);
        return result;
      }),
  }),
  control: router({
    integrations: protectedProcedure.query(() => listIntegrationStates()),
    repositories: protectedProcedure.query(() => listRepositoryInventory()),
    githubHealth: protectedProcedure.query(() => listGitHubWorkflowHealth()),
    audit: protectedProcedure.query(({ ctx }) => listAuditEntries(ctx.user.id)),
    automationReadiness: protectedProcedure.query(() => ({
      state: "review_required",
      summary: "The UI can create drafts and monitor integration status. Persistent 24×7 execution requires a published app and a durable n8n or always-on runtime.",
    })),
    analyzeRepository: protectedProcedure
      .input(z.object({ fullName: z.string().min(3).max(240) }))
      .mutation(async ({ ctx, input }) => {
        const repo = await getRepositoryByFullName(input.fullName);
        if (!repo) throw new Error("Repository metadata is not available in the read-only inventory.");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a repository analyst. Analyze only the supplied GitHub metadata. Do not invent code contents, file structures, vulnerabilities, or execution results. Return a short learning-oriented review with: architecture signals, relevant agent-platform learning opportunities, and a safe next read-only step." },
            { role: "user", content: JSON.stringify({ fullName: repo.fullName, description: repo.description, visibility: repo.visibility, primaryLanguage: repo.primaryLanguage, updatedAt: repo.observedAt }) },
          ],
        });
        const content = response.choices?.[0]?.message?.content;
        const analysis = typeof content === "string" ? content : "No analysis text was returned.";
        await logAuditEntry(ctx.user.id, "repository", "Read-only metadata analysis", `Analyzed GitHub metadata for ${repo.fullName}.`);
        return { analysis, repository: repo.fullName };
      }),
  }),
  n8n: router({
    boundary: protectedProcedure.query(() => ({
      endpointStatus: "local-only",
      publicEndpoint: false,
      durableHost: false,
      permittedAction: "draft_connection_review",
      detail: "The current n8n work is local and temporary. A durable HTTPS host is required before an endpoint can be registered with external agents.",
    })),
    createConnectionReview: protectedProcedure
      .input(z.object({ candidateUrl: z.string().url().refine((url) => url.startsWith("https://"), "Only HTTPS endpoint drafts are accepted.") }))
      .mutation(async ({ ctx, input }) => {
        const id = await createAgentTask({
          ownerId: ctx.user.id,
          title: "Review n8n endpoint registration",
          brief: `Review-only request for the candidate endpoint ${input.candidateUrl}. Verify durable hosting, authentication, and MCP/webhook scope before any connection is registered.`,
          type: "automation",
          status: "draft",
          riskLevel: "review_required",
        });
        await logAuditEntry(ctx.user.id, "n8n", "Endpoint review draft created", "A candidate n8n endpoint was recorded as a review-only draft.");
        return { id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
