import { describe, expect, it } from "vitest";

describe("GitHub monitoring credential", () => {
  it("authenticates the configured server-side token against the GitHub user endpoint", async () => {
    const token = process.env.GITHUB_TOKEN;

    expect(token, "GITHUB_TOKEN must be available only on the server").toBeTruthy();

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.status).toBe(200);
    const account = (await response.json()) as { login?: string };
    expect(account.login).toBe("balajirajput96");
  }, 20_000);
});
