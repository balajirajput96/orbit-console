import { scanGitHubActionsHealth } from "../server/githubMonitoring";

async function main() {
  const result = await scanGitHubActionsHealth();
  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
