# Daily GitHub Actions Monitoring Design

Orbit Console will perform one **daily** server-side scan of the owner’s GitHub repositories. The scan is deterministic: it retrieves each repository’s latest Actions run, classifies the run as healthy, pending, or actionable failure, and records the normalized result for the authenticated dashboard.

## Data model

The application will add a `github_workflow_health` table keyed by repository full name. Each scan upserts the latest known run metadata: repository, workflow name, run identifier, branch, status, conclusion, run update timestamp, and scan timestamp. A scan is idempotent because a repeated check overwrites the same repository’s current state instead of accumulating duplicate rows.

## Execution boundary

The schedule runs once daily at **09:15 UTC**. It calls a protected scheduled endpoint, authenticates the scheduler identity, reads a server-only GitHub token, limits the check to the persisted repository inventory, and writes a summary audit entry. The HTTP handler returns structured JSON and treats missing inventory as a successful no-op, so retries cannot create duplicate state.

## Dashboard behavior

Authenticated users see a compact GitHub Actions health panel listing actionable failures and pending runs. The panel remains read-only: it can create review drafts but cannot re-run, cancel, merge, or modify GitHub workflows.

## Required credential

The deployed application needs a GitHub fine-grained personal access token stored only as `GITHUB_TOKEN`, with **read-only Actions and repository metadata** access to the owner’s repositories. The token is never returned through tRPC, browser code, audit details, or source control.

## Pre-schedule validation

The scan was exercised against all 100 persisted repository records using the server-side token. Initial sequential retrieval exceeded the scheduled-callback time budget; the implementation now retrieves GitHub API responses in bounded batches and persists each batch serially. A long Dependabot workflow title also exposed a database field-length boundary, which is now normalized before persistence. The corrected scan completed in approximately 12 seconds and stored every repository without unavailable records: **77 healthy, 1 pending, 11 failed, and 11 without a classified latest run**. The failed records remain read-only review signals, not automatic remediation commands.
