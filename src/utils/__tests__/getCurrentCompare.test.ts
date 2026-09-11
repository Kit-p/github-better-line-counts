import { describe, expect, it } from "vitest";
import { getCurrentCompare } from "../getCurrentCompare";
import { JSDOM } from "jsdom";

describe("getCurrentCompare", () => {
  it.each([
    [
      { base: "v1.5.2", head: "4443018" },
      "https://github.com/aklinker1/github-better-line-counts/compare/v1.5.2...4443018",
    ],
    [
      { base: "v1.5.2", head: "4443018" },
      "https://github.com/aklinker1/github-better-line-counts/compare/v1.5.2..4443018",
    ],
    [
      { base: "v1.7.7", head: "v1.8.0" },
      "https://github.com/aklinker1/github-better-line-counts/compare/v1.7.7...v1.8.0",
    ],
    // Branch names with slashes
    [
      { base: "main", head: "feat/breakdown-categories" },
      "https://github.com/aklinker1/github-better-line-counts/compare/main...feat/breakdown-categories",
    ],
    [
      { base: "release/1.0", head: "feat/foo/bar" },
      "https://github.com/aklinker1/github-better-line-counts/compare/release/1.0...feat/foo/bar/",
    ],
    // Cross-fork compare and the pull request creation page
    [
      {
        base: "main",
        head: "Kit-p:github-better-line-counts:feat/breakdown-categories",
      },
      "https://github.com/aklinker1/github-better-line-counts/compare/main...Kit-p:github-better-line-counts:feat/breakdown-categories?expand=1",
    ],
    // Only the head: GitHub omits the base when it is the default branch
    [
      { head: "feat/breakdown-categories" },
      "https://github.com/Kit-p/github-better-line-counts/compare/feat/breakdown-categories?expand=1",
    ],
    [
      { head: "v1.8.0" },
      "https://github.com/aklinker1/github-better-line-counts/compare/v1.8.0",
    ],
    [
      { head: "Kit-p:github-better-line-counts:feat/foo" },
      "https://github.com/aklinker1/github-better-line-counts/compare/Kit-p:github-better-line-counts:feat/foo",
    ],
    [
      undefined,
      "https://github.com/aklinker1/github-better-line-counts/compare/...",
    ],
    [
      undefined,
      "https://github.com/aklinker1/github-better-line-counts/compare/...123",
    ],
    [
      undefined,
      "https://github.com/aklinker1/github-better-line-counts/compare/123...",
    ],
    [
      undefined,
      "https://github.com/aklinker1/github-better-line-counts/compare/",
    ],
    [undefined, "https://github.com/aklinker1/github-better-line-counts/pulls"],
  ])("should return the compared refs based on the URL", (expected, url) => {
    const jsdom = new JSDOM("", { url });

    expect(getCurrentCompare(jsdom.window)).toEqual(expected);
  });
});
