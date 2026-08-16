import { readFile } from "node:fs/promises";
import { upsertIntegrationState, upsertRepositoryMetadata } from "../server/db.ts";

const inventoryPath = "/home/ubuntu/agent-platform-repository-inventory-clean.json";
const rawInventory = await readFile(inventoryPath, "utf8");
const repositories = JSON.parse(rawInventory);
const observedAt = new Date();

if (!Array.isArray(repositories) || repositories.length === 0) {
  throw new Error("Repository inventory is missing or empty.");
}

for (const repo of repositories) {
  await upsertRepositoryMetadata({
    fullName: repo.nameWithOwner,
    description: typeof repo.description === "string" && repo.description.trim() ? repo.description.trim() : null,
    visibility: repo.isPrivate ? "private" : "public",
    primaryLanguage: typeof repo.language === "string" && repo.language ? repo.language : null,
    sourceUrl: repo.url,
    observedAt,
  });
}

const integrations = [
  {
    integrationKey: "antigravity_cli",
    label: "Antigravity CLI",
    status: "connected",
    mode: "workspace-scoped",
    detail: "Signed in to the owner’s Google account and limited to the dedicated agent-platform workspace.",
  },
  {
    integrationKey: "jules",
    label: "Jules",
    status: "connected",
    mode: "review-first",
    detail: "Signed in to the owner’s Google account with repository visibility; code changes remain review-gated.",
  },
  {
    integrationKey: "github",
    label: "GitHub",
    status: "connected",
    mode: "read-first",
    detail: "Owner repository metadata is inventoried for read-only analysis and source-control publication.",
  },
  {
    integrationKey: "hugging_face",
    label: "Hugging Face",
    status: "available",
    mode: "discovery",
    detail: "Model and dataset discovery is available; no hosted model endpoint is deployed by this application.",
  },
  {
    integrationKey: "gemini",
    label: "Google / Gemini",
    status: "limited",
    mode: "account-connected",
    detail: "Google session and scheduled Spark review are available, but the configured developer API credential needs replacement before API use.",
  },
  {
    integrationKey: "n8n",
    label: "n8n",
    status: "limited",
    mode: "local-only",
    detail: "Local workflow drafts exist; durable public HTTPS hosting is required before external workflow endpoints can be registered.",
  },
];

for (const integration of integrations) {
  await upsertIntegrationState({ ...integration, verifiedAt: observedAt });
}

console.log(`Seeded ${repositories.length} repositories and ${integrations.length} integration states.`);
