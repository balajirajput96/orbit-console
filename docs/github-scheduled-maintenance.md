# Bounded GitHub Scheduled Maintenance

## Purpose

This policy defines a **review-gated** maintenance loop for the owner-controlled `balajirajput96/AgentGPT` and `balajirajput96/fastmcp` repositories. It supplements Orbit Console's existing read-only portfolio health scan. It is deliberately not a self-modifying agent: the scheduled workflows inspect recent CI outcomes, run a bounded repository validation command, and record a reviewable maintenance state. They do not merge pull requests, alter repository settings, rotate credentials, or write source-code patches.

## Execution model

Each repository receives one hourly GitHub Actions workflow, offset from the top of the hour. The workflow derives its cycle count from its own durable GitHub Actions run history and writes a concise result to the run summary. The workflow stops its active maintenance work after **2,400 completed cycles**. Manual runs remain available for diagnostics, but they do not bypass the same safety controls.

| Control | Policy |
| --- | --- |
| Scope | AgentGPT and fastmcp only; both are owner-controlled and recently remediated. |
| Trigger | Hourly GitHub Actions schedule plus manual dispatch. |
| Validation | Existing repository-supported formatting, type-check, test, or build command only. |
| Cycle limit | 2,400 state-tracked cycles; later triggers exit without new validation work. |
| Concurrency | One maintenance run per repository; queued work is not allowed to overlap. |
| Reporting | GitHub Actions run history, run summaries, normal Actions logs, and one sanitized remediation-draft artifact per run. |
| Failure behavior | Preserve logs, set a failed state summary, and leave a reviewable issue; never retry indefinitely. |
| Forbidden actions | Automatic merge, force push, credential handling, issue spam, arbitrary command execution, and source changes. |

## Validation commands

The workflows use package-manager commands already declared by their respective repositories. If a command is unavailable or fails, the workflow records the exact command name and exit result in the state issue. It must not substitute an unverified command or silently change dependencies.

## Operating boundaries

The remediation-draft artifact contains only a cycle number, validation outcome, and bounded next-action statement. It must never contain tokens, passwords, recovery codes, raw test logs, personal data, command output, or source changes. Repository changes remain pull-request based and require explicit validation before merge.
