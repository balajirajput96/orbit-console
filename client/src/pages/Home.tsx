import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Bot, CheckCircle2, CircleDashed, Code2, FolderGit2, ImagePlus, KeyRound, LockKeyhole, Play, Plus, ServerCog, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type TaskType = "code" | "analysis" | "image" | "video" | "automation";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "Orbit operates within the connected workspace and keeps external actions in review-first mode." },
    { role: "assistant", content: "I’m **Orbit**, your agent control assistant. I can draft work, analyze connected project context, and create assets. External writes, deployments, and persistent automations stay review-gated." },
  ]);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskBrief, setTaskBrief] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("code");
  const [repositoryAnalysis, setRepositoryAnalysis] = useState<{ repository: string; analysis: string } | null>(null);
  const [n8nCandidateUrl, setN8nCandidateUrl] = useState("");
  const utils = trpc.useUtils();
  const tasksQuery = trpc.tasks.list.useQuery();
  const integrationsQuery = trpc.control.integrations.useQuery();
  const repositoriesQuery = trpc.control.repositories.useQuery();
  const githubHealthQuery = trpc.control.githubHealth.useQuery();
  const auditQuery = trpc.control.audit.useQuery();
  const readinessQuery = trpc.control.automationReadiness.useQuery();
  const n8nBoundaryQuery = trpc.n8n.boundary.useQuery();
  const chatMutation = trpc.agent.chat.useMutation({
    onSuccess: ({ answer }) => setMessages((current) => [...current, { role: "assistant", content: answer }]),
    onError: (error) => toast.error(error.message || "Orbit could not respond."),
  });
  const imageMutation = trpc.agent.generateImage.useMutation({
    onSuccess: ({ url }) => {
      setGeneratedImage(url ?? null);
      toast.success("Image generated and stored securely.");
      utils.control.audit.invalidate();
    },
    onError: (error) => toast.error(error.message || "Image generation failed."),
  });
  const createTask = trpc.tasks.createDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft task added to review queue.");
      setTaskDialogOpen(false);
      setTaskTitle("");
      setTaskBrief("");
      utils.tasks.list.invalidate();
      utils.control.audit.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not create draft."),
  });
  const analyzeRepository = trpc.control.analyzeRepository.useMutation({
    onSuccess: (result) => {
      setRepositoryAnalysis(result);
      toast.success("Read-only repository analysis is ready.");
      utils.control.audit.invalidate();
    },
    onError: (error) => toast.error(error.message || "Repository analysis could not be completed."),
  });
  const createN8nReview = trpc.n8n.createConnectionReview.useMutation({
    onSuccess: () => {
      toast.success("n8n endpoint review added to the draft queue.");
      setN8nCandidateUrl("");
      utils.tasks.list.invalidate();
      utils.control.audit.invalidate();
    },
    onError: (error) => toast.error(error.message || "Use a valid HTTPS endpoint for review."),
  });

  const stats = useMemo(() => [
    { label: "Connected surfaces", value: String(integrationsQuery.data?.filter((item) => item.status === "connected").length ?? 0), icon: CheckCircle2, note: "verified sessions" },
    { label: "Draft queue", value: String(tasksQuery.data?.length ?? 0), icon: CircleDashed, note: "review-gated" },
    { label: "Repository signals", value: String(repositoriesQuery.data?.length ?? 0), icon: FolderGit2, note: "read-first" },
  ], [integrationsQuery.data, repositoriesQuery.data, tasksQuery.data]);

  const handleChat = (content: string) => {
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    chatMutation.mutate({ messages: next.map(({ role, content: message }) => ({ role, content: message })) });
  };

  const submitImage = () => {
    if (prompt.trim().length < 5) {
      toast.error("Describe the image in at least five characters.");
      return;
    }
    imageMutation.mutate({ prompt });
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(112deg,oklch(0.21_0.055_246/.95),oklch(0.17_0.025_246/.9))] p-6 shadow-2xl sm:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> Agent command center</div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Build with agents. Keep control.</h1>
            <p className="max-w-xl text-sm leading-6 text-slate-300">A review-first cockpit for coding, research, image creation, and automation. Sensitive writes remain drafts until a verified integration and explicit action path exist.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild><Button className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Plus className="mr-2 h-4 w-4" /> Create draft</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[520px]"><DialogHeader><DialogTitle>Create a review-gated task</DialogTitle><DialogDescription>Tasks are created as drafts. Nothing runs automatically from this form.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="title">Task title</Label><Input id="title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Audit the agent platform architecture" /></div><div className="space-y-2"><Label htmlFor="type">Work type</Label><Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType)}><SelectTrigger id="type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="code">Code</SelectItem><SelectItem value="analysis">Analysis</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="video">Video brief</SelectItem><SelectItem value="automation">Automation</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="brief">Brief</Label><Textarea id="brief" value={taskBrief} onChange={(event) => setTaskBrief(event.target.value)} placeholder="Define the deliverable, constraints, and expected review." /></div><Button className="w-full" disabled={createTask.isPending} onClick={() => createTask.mutate({ title: taskTitle, brief: taskBrief, type: taskType })}>{createTask.isPending ? "Saving draft…" : "Save draft for review"}</Button></div></DialogContent>
            </Dialog>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => document.getElementById("integrations")?.scrollIntoView({ behavior: "smooth" })}><ShieldCheck className="mr-2 h-4 w-4" /> Review boundaries</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => <Card key={stat.label} className="border-white/8 bg-card/80 shadow-xl shadow-black/10"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200"><stat.icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold">{stat.value}</p><p className="text-sm font-medium">{stat.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{stat.note}</p></div></CardContent></Card>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.78fr)]">
        <Card className="min-h-[620px] overflow-hidden border-white/8 bg-card/85 shadow-2xl shadow-black/15"><CardHeader className="border-b border-white/8 bg-white/[0.02]"><div className="flex items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-cyan-200" /> Orbit workspace</CardTitle><CardDescription>Planning and orchestration assistance, with explicit execution boundaries.</CardDescription></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">Review-first</span></div></CardHeader><CardContent className="p-0"><AIChatBox messages={messages} onSendMessage={handleChat} isLoading={chatMutation.isPending} height="520px" placeholder="Ask Orbit to draft a plan, review code, or prepare an agent brief…" suggestedPrompts={["Create a safe plan for a repository architecture audit", "Draft a product brief for an image-generation feature", "List the review gates needed before scheduling an agent"]} /></CardContent></Card>
        <div className="space-y-5">
          <Card className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ImagePlus className="h-4 w-4 text-violet-300" /> Asset lab</CardTitle><CardDescription>Generate a visual asset from a controlled prompt.</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g., A polished editorial illustration of a human and AI code-review team…" className="min-h-24" /><Button className="w-full" variant="secondary" disabled={imageMutation.isPending} onClick={submitImage}>{imageMutation.isPending ? "Generating…" : "Generate image"}</Button>{generatedImage ? <img src={generatedImage} alt="Generated agent asset" className="max-h-52 w-full rounded-xl border border-white/10 object-cover" /> : <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-xs text-muted-foreground">Generated images appear here.</div>}</CardContent></Card>
          <Card className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><LockKeyhole className="h-4 w-4 text-amber-300" /> Automation posture</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{readinessQuery.data?.summary ?? "Loading automation boundary…"}</p><div className="mt-4 flex items-center gap-2 text-xs text-amber-200"><ShieldCheck className="h-4 w-4" /> {readinessQuery.data?.state?.replaceAll("_", " ") ?? "Loading"}</div></CardContent></Card>
	          <Card id="n8n-boundary" className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleDashed className="h-4 w-4 text-amber-300" /> n8n boundary</CardTitle><CardDescription>Endpoints cannot be registered from a temporary local runtime.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-muted-foreground"><p className="font-medium text-amber-100">{n8nBoundaryQuery.data?.endpointStatus?.replaceAll("-", " ") ?? "Checking endpoint status"}</p><p className="mt-1">{n8nBoundaryQuery.data?.detail ?? "Loading durable-hosting requirements…"}</p></div><div className="flex gap-2"><Input aria-label="Candidate n8n HTTPS endpoint" value={n8nCandidateUrl} onChange={(event) => setN8nCandidateUrl(event.target.value)} placeholder="https://n8n.example.com" /><Button size="sm" variant="outline" className="shrink-0" disabled={createN8nReview.isPending || !n8nCandidateUrl.trim()} onClick={() => createN8nReview.mutate({ candidateUrl: n8nCandidateUrl.trim() })}>{createN8nReview.isPending ? "Drafting…" : "Review"}</Button></div><p className="text-[11px] leading-4 text-muted-foreground">A review checks HTTPS hosting, authentication, and scope. It does not connect or activate n8n.</p></CardContent></Card>
	          <Card className="border-amber-300/15 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-300" /> Automation readiness</CardTitle><CardDescription>Three external prerequisites remain before every configured provider can run autonomously.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-white/8 bg-white/[0.025] p-3"><div className="flex gap-2"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" /><div><p className="text-xs font-medium text-slate-100">Gemini developer credential</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Replace the invalid n8n credential with a valid Google AI Studio API key. Keys are never displayed or stored in this dashboard.</p><a className="mt-2 inline-block text-[11px] font-medium text-cyan-200 hover:text-cyan-100" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Open Google AI Studio</a></div></div></div><div className="rounded-lg border border-white/8 bg-white/[0.025] p-3"><div className="flex gap-2"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" /><div><p className="text-xs font-medium text-slate-100">xAI / Grok developer credential</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Replace the rejected xAI key in n8n with an active key from the xAI console; the current credential is not accepted by the provider.</p><a className="mt-2 inline-block text-[11px] font-medium text-cyan-200 hover:text-cyan-100" href="https://console.x.ai" target="_blank" rel="noreferrer">Open xAI Console</a></div></div></div><div className="rounded-lg border border-white/8 bg-white/[0.025] p-3"><div className="flex gap-2"><ServerCog className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" /><div><p className="text-xs font-medium text-slate-100">Always-on n8n runtime</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Use the prepared deployment package on a computer that stays online. After it has a public HTTPS address, submit that address above for a controlled connection review.</p></div></div></div></CardContent></Card>
          <Card className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Workflow className="h-4 w-4 text-emerald-300" /> GitHub Actions health</CardTitle><CardDescription>Daily server-side scan. Read-only workflow visibility.</CardDescription></CardHeader><CardContent className="space-y-2">{githubHealthQuery.data?.length ? <><div className="flex gap-3 text-xs"><span className="text-rose-200">{githubHealthQuery.data.filter((item) => item.health === "failed").length} failed</span><span className="text-amber-200">{githubHealthQuery.data.filter((item) => item.health === "pending").length} pending</span><span className="text-emerald-200">{githubHealthQuery.data.filter((item) => item.health === "healthy").length} healthy</span></div>{githubHealthQuery.data.filter((item) => item.health !== "healthy").slice(0, 3).map((item) => <a key={item.fullName} href={item.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-white/8 bg-white/[0.025] p-2.5 transition-colors hover:bg-white/[0.06]"><p className="truncate text-xs font-medium">{item.fullName}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.workflowName ?? "No workflow run"} · {item.status.replaceAll("_", " ")}</p></a>)}</> : <p className="text-sm leading-5 text-muted-foreground">The first scheduled scan will populate workflow health records.</p>}</CardContent></Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Code2 className="h-4 w-4 text-emerald-300" /> Review queue</CardTitle><CardDescription>Draft tasks are safe to edit; queued work still requires a verified execution route.</CardDescription></CardHeader><CardContent className="space-y-3">{tasksQuery.data?.length ? tasksQuery.data.map((task) => <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3" key={task.id}><div><p className="text-sm font-medium">{task.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.brief}</p><div className="mt-2 flex gap-2 text-[11px] uppercase tracking-wide text-cyan-200"><span>{task.type}</span><span>·</span><span>{task.status}</span></div></div><Play className="mt-1 h-4 w-4 text-muted-foreground" /></div>) : <div className="rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-muted-foreground">No drafts yet. Create a review-gated task to start.</div>}</CardContent></Card>
        <Card id="integrations" className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-cyan-200" /> Connected surfaces</CardTitle><CardDescription>Status reflects verified sessions and integration boundaries, not blanket execution authority.</CardDescription></CardHeader><CardContent className="space-y-3">{integrationsQuery.data?.map((integration) => <div key={integration.integrationKey} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3"><span className={`mt-1 h-2.5 w-2.5 rounded-full ${integration.status === "connected" ? "bg-emerald-300" : integration.status === "limited" ? "bg-amber-300" : "bg-slate-400"}`} /><div><p className="text-sm font-medium">{integration.label}<span className="ml-2 text-xs font-normal text-muted-foreground">{integration.mode}</span></p><p className="mt-1 text-xs leading-5 text-muted-foreground">{integration.detail}</p></div></div>)}</CardContent></Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderGit2 className="h-4 w-4 text-sky-300" /> Repository inventory</CardTitle><CardDescription>Metadata only. The analysis does not clone, modify, or execute repository code.</CardDescription></CardHeader><CardContent className="space-y-3">{repositoriesQuery.data?.slice(0, 5).map((repo) => <div key={repo.fullName} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium">{repo.fullName}</p><p className="line-clamp-1 text-xs text-muted-foreground">{repo.description || "No repository description available."}</p></div><div className="flex shrink-0 items-center gap-2"><span className="hidden text-xs text-cyan-200 sm:inline">{repo.visibility}</span><Button size="sm" variant="outline" className="border-cyan-300/20 bg-cyan-300/5 text-cyan-100 hover:bg-cyan-300/15 hover:text-white" disabled={analyzeRepository.isPending} onClick={() => analyzeRepository.mutate({ fullName: repo.fullName })}>{analyzeRepository.isPending ? "Reviewing…" : "Analyze"}</Button></div></div>)}{repositoryAnalysis ? <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/[0.04] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200">Read-only analysis · {repositoryAnalysis.repository}</p><div className="prose prose-sm prose-invert mt-2 max-w-none leading-6"><Streamdown>{repositoryAnalysis.analysis}</Streamdown></div></div> : null}</CardContent></Card>
        <Card className="border-white/8 bg-card/85"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-fuchsia-300" /> Activity trace</CardTitle><CardDescription>Persistent audit entries appear after in-app AI, asset, and draft-task actions.</CardDescription></CardHeader><CardContent className="space-y-3">{auditQuery.data?.length ? auditQuery.data.slice(0, 5).map((entry) => <div key={entry.id} className="border-l border-cyan-300/50 pl-3"><p className="text-sm font-medium">{entry.action}</p><p className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</p></div>) : <p className="text-sm text-muted-foreground">No in-app activity has been recorded yet.</p>}</CardContent></Card>
      </section>
    </div>
  );
}
