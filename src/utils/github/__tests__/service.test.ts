import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { createGithubService, type RecalculateOptions } from "../service";
import type { GithubApi } from "../api";
import type { DiffEntry } from "../types";
import {
  breakdownCategoriesStorage,
  customListsStorage,
} from "@/utils/storage";

function file(filename: string, additions: number, deletions: number) {
  return {
    filename,
    sha: filename,
    additions,
    deletions,
    changes: additions + deletions,
    status: "modified",
  } satisfies DiffEntry;
}

function createFakeApi(files: DiffEntry[], gitattributes?: string) {
  return {
    getUser: vi.fn(),
    getGitAttributesFile: vi.fn().mockResolvedValue(gitattributes),
    getPr: vi.fn().mockResolvedValue({
      head: { sha: "abc123" },
      additions: 0,
      deletions: 0,
      changed_files: files.length,
    }),
    getCommit: vi.fn(),
    getAllPrFiles: vi.fn().mockResolvedValue(files),
    compareCommits: vi.fn(),
  } satisfies Record<keyof GithubApi, unknown> as unknown as GithubApi;
}

const prOptions = (mountId: number): RecalculateOptions => ({
  mountId,
  type: "pr",
  owner: "owner",
  repo: "repo",
  pr: 1,
});

describe("GithubService", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    await customListsStorage.setValue({ all: "*.lock" });
    await breakdownCategoriesStorage.setValue([
      {
        id: "tests",
        name: "Tests",
        icon: "",
        color: "#000000",
        patterns: "*.test.*\n__tests__/",
      },
      {
        id: "docs",
        name: "Docs",
        icon: "",
        color: "#000000",
        patterns: "# Documentation\n*.md\n",
      },
    ]);
  });

  const files = [
    // Generated via options
    file("bun.lock", 10, 0),
    // Generated via .gitattributes
    file("vendor/lib.js", 100, 5),
    // Tests
    file("src/a.test.ts", 20, 2),
    // Matches both tests and docs, first category wins
    file("src/__tests__/README.md", 3, 1),
    // Docs
    file("README.md", 5, 0),
    // Uncategorized
    file("src/index.ts", 40, 10),
  ];
  const gitattributes = "vendor/** linguist-generated";

  it("should subtract generated files and break the rest down by category", async () => {
    const service = createGithubService(createFakeApi(files, gitattributes));

    const result = await service.recalculateDiff(prOptions(1));

    expect(result.all).toEqual({
      additions: 178,
      deletions: 18,
      changes: 196,
      files: 6,
    });
    expect(result.exclude).toEqual({
      additions: 110,
      deletions: 5,
      changes: 115,
      files: 2,
    });
    expect(result.include).toEqual({
      additions: 68,
      deletions: 13,
      changes: 81,
      files: 4,
    });
    expect(result.breakdown).toEqual({
      tests: { additions: 23, deletions: 3, changes: 26, files: 2 },
      docs: { additions: 5, deletions: 0, changes: 5, files: 1 },
    });
    expect(result.other).toEqual({
      additions: 40,
      deletions: 10,
      changes: 50,
      files: 1,
    });
  });

  it("should include a zeroed summary for categories with no matching files", async () => {
    const service = createGithubService(
      createFakeApi([file("src/index.ts", 1, 1)]),
    );

    const result = await service.recalculateDiff(prOptions(1));

    expect(result.breakdown).toEqual({
      tests: { additions: 0, deletions: 0, changes: 0, files: 0 },
      docs: { additions: 0, deletions: 0, changes: 0, files: 0 },
    });
    expect(result.other).toEqual({
      additions: 1,
      deletions: 1,
      changes: 2,
      files: 1,
    });
  });

  it("should reuse the cached result for the same commit", async () => {
    const api = createFakeApi(files, gitattributes);
    const service = createGithubService(api);

    const first = await service.recalculateDiff(prOptions(1));
    const second = await service.recalculateDiff(prOptions(2));

    expect(second).toEqual(first);
    expect(api.getAllPrFiles).toHaveBeenCalledTimes(1);
  });
});
