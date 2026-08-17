# GitHub Remediation Inventory

This inventory covers the latest visible GitHub Actions run for **100** repositories owned by `balajirajput96`, collected on 17 August 2026. It is a triage record, not proof that every repository can be built in the same environment. Repositories may use distinct languages, external services, private credentials, upstream fork workflows, or platform-specific runners.

## Priority candidates

| Repository | Latest status | Branch | Initial handling |
| --- | --- | --- | --- |
| `hub-docs` | Failed SageMaker workflow | `fix/skip-sagemaker-upload-in-fork` | Inspect the fork-safe workflow conditions and rerun after a reviewable change. |
| `microsoft-365-agents-toolkit` | Failed Copilot cloud-agent workflow | `bowsong/hotfix_kiota` | Inspect as an upstream/fork branch before any local code change. |
| `B` | Failed Copilot workflow | `copilot/fix-1de88a58-b3b9-4ab2-9a04-938f03d5544e` | Review the old agent branch and determine whether a current failure still reproduces. |
| `openai-node` | Failed Dependabot workflow | `master` | Confirm whether the historical failure is still reproducible before changing dependencies. |
| `openai-agents-js` | Failed Dependabot workflow | `main` | Confirm whether the historical failure is still reproducible before changing dependencies. |
| `uv` | Failed Dependabot workflow | `main` | Treat as a historical upstream/fork failure until reproduced. |

## Non-failure statuses

Cancelled Dependabot jobs on `pharma-qa-job-tracker`, `autonomous-ai-workspace`, `chatbot`, `diffusers`, `woocommerce`, and `ai` are not automatically code defects. Queued Dependabot jobs on `bulk-resume-sender`, `sellbuilding-ai-agent`, `github-dashboard`, and `gmail-resume-mailer` require completion before a failure diagnosis is possible.

## Guardrails

Every remediation must first reproduce a concrete failure, stay on a reviewable branch, run the repository's documented validation, and use an ordinary commit. No `git rebase`, force push, credential changes, secret exposure, or workflow activation is performed merely because a historical run failed.

## Deferred historical candidate

The non-fork `B` repository has historical failed Azure Web Apps runs from 2025, but its current default branch contains only a minimal HTML README and a single active dynamic Copilot workflow. The historical Azure workflow file is no longer present in the current branch, so the old Azure failure cannot be reproduced or safely repaired from the current source. No code change was made to this repository.

The `microsoft-365-agents-toolkit`, `openai-node`, `openai-agents-js`, and `uv` candidates are forks whose listed failures are historical workflow runs. A fresh filter of the 100-repository latest-run inventory found no remaining failures with an August 2026 timestamp after the hub-docs repair. Cancelled and queued Dependabot runs are recorded as non-code statuses until they either complete or reproduce a concrete project failure.

## Completed remediation

The `hub-docs` failure on branch `fix/skip-sagemaker-upload-in-fork` was diagnosed with the authenticated Antigravity CLI and local workflow inspection. The branch contained both a generic closed-PR comment-deletion trigger and a redundant SageMaker-specific trigger. The stale SageMaker workflow was removed and the listener was narrowed to the remaining generic trigger in commit `7b626b9b` (`ci: remove redundant SageMaker delete-comment trigger`). The remaining generic trigger and listener were then guarded so they run only in `huggingface/hub-docs`, preventing the fork from invoking upstream-only resources; this was committed as `77c3f941` (`ci: skip delete comment workflows in forks`).

Pull request [#7](https://github.com/balajirajput96/hub-docs/pull/7) passed its `Secret Leaks` check and was merged to `main` as commit `35d3ddd`. The post-merge `Secret Leaks` run `32035904934` completed successfully. GitHub now registers only `Delete doc comment` and `Delete doc comment trigger`; the redundant SageMaker workflow is absent. Remote `main` contents also confirm the upstream-only guards in both remaining delete-comment workflow files. This is a branch and registration-level validation; no synthetic pull request was created solely to manufacture a closed-PR event.
