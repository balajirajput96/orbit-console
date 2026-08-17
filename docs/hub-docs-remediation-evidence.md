# hub-docs Workflow Remediation Evidence

## Scope

The public fork `balajirajput96/hub-docs` had PR-close failures caused by comment-deletion workflows that delegate to `huggingface/doc-builder`. GitHub Actions reported failures with no jobs or retained logs, preventing a job-level diagnosis from the run itself.

## Remediation history

| Change | Commit / PR | Verification |
| --- | --- | --- |
| Removed redundant SageMaker delete-comment trigger and stale listener reference. | `7b626b9b` | Static workflow checks passed; branch `Secret Leaks` run `32035485305` succeeded. |
| Added fork guards to generic delete-comment workflows; later found preflight resolution could fail before a reusable-workflow job guard is evaluated. | `77c3f941`, PR [#7](https://github.com/balajirajput96/hub-docs/pull/7) | PR check passed; PR merged as `35d3ddd`; main `Secret Leaks` run `32035904934` succeeded. |
| Removed the remaining upstream-only comment-deletion workflows from the fork, eliminating the external reusable-workflow preflight path entirely. | PR [#8](https://github.com/balajirajput96/hub-docs/pull/8), merged as `93be625` | PR check passed; main `Secret Leaks` run `32036453746` succeeded. |

## Post-change confirmation

GitHub's workflow registry on the merged default branch has **no** remaining paths that match `delete_doc_comment`. The latest pull-request event run list contains the prior failed generic trigger at `77c3f94`, but no newer delete-comment workflow run after PR #8 merged; this is expected because those workflow files were removed. The fork no longer attempts to invoke upstream-only delete-comment reusable workflows on PR closure.

No rebase, force push, secret edit, or external upstream repository change was performed.
