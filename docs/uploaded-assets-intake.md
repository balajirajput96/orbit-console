# Uploaded Assets Intake Record

**Reviewed:** 18 August 2026 (UTC)

## Security boundary

> The uploaded material was treated as untrusted data. No archive was executed, no notebook was run, no installer was started, no credentials were imported, and no recovery code was used or retained in project materials.

| Asset group | Safe finding | Disposition |
| --- | --- | --- |
| GitHub recovery-code text file | Authentication recovery material. | Treated as compromised after upload exposure. The GitHub recovery-code set was regenerated on 18 August 2026, invalidating the previously uploaded set. No code values are stored in source control, logs, or application storage. |
| Two CSV exports | Large GitHub audit-log-style exports containing actor, access, request, and alert fields. | Do not ingest into Orbit Console by default because the records may contain sensitive operational data. |
| Partial Ollama installer | Empty incomplete-download file. | Ignored; it is not an installable artifact. |
| GPT-OSS 120B notebook | Colab notebook that describes loading a very large model and using a Hugging Face token. | Not executed. It is unsuitable for the current lightweight runtime and requires an explicitly configured model provider. |
| Copilot CLI archive | Source-code archive containing shell installation material and GitHub workflows. | Reference-only; no installer or bundled code was executed. |
| Certificate portfolio archives | Static portfolio HTML/JavaScript plus certificate data. | Kept separate from the control platform until a dedicated public portfolio requirement exists. |
| Professional reel archive | Video drafts and descriptive/editing documents. | Kept as creative source material; no video was published or added to the application. |
| AI Automation Hub archive | A static in-memory JavaScript prototype with no observed network-call implementation in its application script. | Not deployed as a separate production app; Orbit Console remains the secure full-stack control surface. |

## n8n workflow bundle

The archive contains nine JSON workflow exports. They are valuable as **inactive drafts**, but should not be activated on a temporary runtime because several have schedules, webhooks, external writes, SSH access, or AI-provider dependencies.

| Workflow | Trigger and connected services observed | Safe onboarding status |
| --- | --- | --- |
| SSL Certificate Monitoring with Discord and Notion | Scheduled trigger, HTTP, SSH, Discord, Notion | Requires host, SSH policy review, and Discord/Notion credentials. |
| Knowledge Store Agent with Google Drive | Chat and Google Drive triggers, Google Drive, OpenAI-compatible AI nodes | Requires a valid model credential and scoped Google Drive access. |
| MCP Server Context Reducer | MCP trigger/client tool, AI agent, memory, sub-workflow tool | Requires an explicit tool allowlist and MCP endpoint review. |
| GitLab Workflow Version Control | Manual/scheduled trigger, GitLab and n8n APIs | Requires a scoped GitLab token and repository mapping. |
| Zendesk to Asana Sync | Webhook, Zendesk, Asana | Requires signed webhook verification and least-privilege credentials. |
| OpenAI Task Automation | Manual trigger and AI agent | Can be reviewed after an active model credential is confirmed. |
| Slack AI Workflow | Manual trigger, OpenAI-compatible node, Slack | Requires scoped Slack and model credentials. |
| WordPress, Wix, and Shopify Integration | Shopify trigger, WordPress, HTTP requests | Requires separate commerce-system authorization and action review. |
| Duplicate SSL Monitor | Same service profile as the SSL monitor above | Do not import alongside the canonical workflow until deduplicated. |

## Recommended safe path

The workflow bundle can be imported into a durable n8n installation **as inactive drafts** once a public HTTPS host and scoped credentials exist. Each workflow should then be reviewed node-by-node, assigned least-privilege credentials, and tested with non-production targets before activation. No uploaded workflow has been enabled or allowed to initiate external writes.
