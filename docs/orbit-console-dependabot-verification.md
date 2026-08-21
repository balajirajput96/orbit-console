# Orbit Console Dependabot verification

**Reviewed:** 21 August 2026 (UTC)

## GitHub finding

An authenticated GitHub review found **Dependabot alert #3** open for `esbuild` in `pnpm-lock.yaml`. The advisory is **moderate severity**, applies only to a **development dependency**, and is patched from `esbuild` **0.25.0** onward. GitHub identified the vulnerable path as `drizzle-kit 0.31.10` → `@esbuild-kit/esm-loader 2.6.5` → `@esbuild-kit/core-utils 3.3.2` → `esbuild 0.18.20`.

| Alert | Advisory | Scope | Vulnerable version | First patched version |
| --- | --- | --- | --- | --- |
| #3 | Development-server cross-origin response exposure | Development | `0.18.20` | `0.25.0` |

The alert page reported that Dependabot had not created an update automatically. No alert was dismissed.

## Remediation

The workspace-level package override in `pnpm-workspace.yaml` now forces every `esbuild` resolution to the validated release **0.28.2**. The project package-manager pin was updated to `pnpm@10.34.4`, and the lockfile was regenerated with that version so the override is applied reproducibly in local development and continuous integration.

After a frozen install, `pnpm why esbuild` reported **one installed version only: `0.28.2`**. The former `0.18.20` transitive path no longer exists in the resolved dependency graph.

## Validation

| Validation | Result |
| --- | --- |
| Frozen dependency installation | Passed (`pnpm install --frozen-lockfile`) |
| Dependency audit | Passed (`pnpm audit`: no known vulnerabilities) |
| TypeScript | Passed (`pnpm check`) |
| Automated tests | Passed (15 tests across 6 test files) |
| Production build | Passed (`pnpm build`) |
| Resolved `esbuild` graph | Passed (one version: `0.28.2`) |

The verified lockfile and this evidence record are published to the default branch. GitHub should reconcile and close alert #3 when it processes the updated dependency graph; the alert should not be dismissed manually.
