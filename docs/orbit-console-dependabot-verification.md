# Orbit Console Dependabot Verification

**Reviewed:** 18 August 2026 (UTC)

## GitHub repository findings

The authenticated GitHub review of `balajirajput96/orbit-console` showed **two open Dependabot alerts**, both limited to the `esbuild` development dependency recorded in `pnpm-lock.yaml`.

| Alert | Severity | Scope | Current GitHub remediation path |
| --- | --- | --- | --- |
| #3 — development-server cross-origin response exposure | Moderate | Development | A patch is available; Dependabot PR #2 proposes updating `esbuild` from 0.25.10 to 0.28.1. |
| #133 — development-server arbitrary-file-read issue on Windows | Low | Development | A patch is available at `esbuild` 0.28.1; Dependabot PR #2 proposes the required update. |

Alert #3 identifies the vulnerable transitive path as `drizzle-kit 0.31.10` through `esbuild 0.18.20`, with the advisory patched from `esbuild` 0.25.0 onward. Alert #133 affects `esbuild` 0.27.3 through 0.28.0 on Windows and is patched at 0.28.1. The browser session showed that both alerts have an available patch.

## Local remediation and validation

The repository dependency graph was updated using the package-manager security remediation flow, an explicit `esbuild` update to 0.28.2, and a compatible Express 5 migration for named wildcard routes. The updated graph passed all available checks:

| Validation | Result |
| --- | --- |
| TypeScript | Passed (`pnpm check`) |
| Automated tests | Passed (14 tests across 6 files) |
| Production build | Passed (`pnpm build`) |
| Local package audit | No known vulnerabilities (`pnpm audit`) |

After the merged dependency graph was published, GitHub closed alert #3. A follow-up authenticated GitHub review briefly showed one remaining low-severity alert (#133), so a repository-level Dependabot refresh was requested. The refreshed GitHub page reported **0 open alerts and 133 closed alerts**. No alert was dismissed; GitHub reconciled the published dependency graph.
