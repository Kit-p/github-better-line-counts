import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { createGithubApi } from "../api";
import { githubPatStorage } from "@/utils/storage";

function stubFetch() {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ head: { sha: "abc123" } }), {
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentHeaders(fetchMock: ReturnType<typeof stubFetch>): Headers {
  return new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
}

describe("GithubApi commit files", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  function commitResponse(count: number) {
    return new Response(
      JSON.stringify({
        sha: "abc",
        stats: { additions: 0, deletions: 0, total: 0 },
        files: Array.from({ length: count }, (_, i) => ({ filename: `f${i}` })),
      }),
      { headers: { "content-type": "application/json" } },
    );
  }

  it("should fetch further pages while a page is full", async () => {
    const fetchMock = vi
      .fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
          new Response(),
      )
      .mockResolvedValueOnce(commitResponse(300))
      .mockResolvedValueOnce(commitResponse(300))
      .mockResolvedValueOnce(commitResponse(20));
    vi.stubGlobal("fetch", fetchMock);

    const commit = await createGithubApi().getCommit({
      owner: "owner",
      repo: "repo",
      ref: "abc",
    });

    expect(commit.files).toHaveLength(620);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("page=2");
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("page=3");
  });

  it("should stop after the first page for small commits", async () => {
    const fetchMock = vi
      .fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
          new Response(),
      )
      .mockResolvedValueOnce(commitResponse(5));
    vi.stubGlobal("fetch", fetchMock);

    const commit = await createGithubApi().getCommit({
      owner: "owner",
      repo: "repo",
      ref: "abc",
    });

    expect(commit.files).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("GithubApi authentication", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("should not send an Authorization header when no token is set", async () => {
    await githubPatStorage.setValue("");
    const fetchMock = stubFetch();

    await createGithubApi().getPr({ owner: "owner", repo: "repo", pr: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentHeaders(fetchMock).has("Authorization")).toBe(false);
  });

  it("should send the token as a bearer token when one is set", async () => {
    await githubPatStorage.setValue("ghp_token");
    const fetchMock = stubFetch();

    await createGithubApi().getPr({ owner: "owner", repo: "repo", pr: 1 });

    expect(sentHeaders(fetchMock).get("Authorization")).toBe(
      "Bearer ghp_token",
    );
  });

  it("should use the token passed to getUser even when a different one is stored", async () => {
    await githubPatStorage.setValue("stored");
    const fetchMock = stubFetch();

    await createGithubApi().getUser("explicit");

    expect(sentHeaders(fetchMock).get("Authorization")).toBe("Bearer explicit");
  });
});
