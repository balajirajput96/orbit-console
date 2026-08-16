# Orbit Console — Operations Boundaries

## Included capabilities

Orbit Console provides authenticated AI chat, generated-image requests, review-gated task drafts, a repository inventory pilot, integration status cards, and a persistent audit trail. The application uses platform-managed server-side model and image services; no model API keys are placed in the browser or committed to source control.

## Connected-services posture

The current control surface records verified availability for Antigravity CLI, Jules, GitHub, Hugging Face, Google/Gemini, and the existing n8n work. These entries do not confer unrestricted automation authority. Repository actions are read-first; Antigravity is restricted to its dedicated local workspace; and n8n remains local-only until it has a durable HTTPS deployment.

## Execution policy

The interface creates drafts and audit entries. It does not merge pull requests, publish source, change credentials, send communication, activate n8n workflows, start background tasks, or schedule recurring jobs from the user interface. Those actions require separately verified integration endpoints and explicit execution controls.

## Deployment notes

The application can be published through the managed project interface after a checkpoint is saved. GitHub is used for source control, not as a runtime for this server-backed application. A 24×7 agent runtime requires a published managed app plus a durable n8n or always-on compute environment.
