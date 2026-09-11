import { describe, expect, it } from "vitest";
import { getCurrentCompare } from "../getCurrentCompare";
import { JSDOM } from "jsdom";

describe("getCurrentCompare", () => {
  it.each([
    [
      ["v1.5.2", "4443018"],
      "https://github.com/aklinker1/github-better-line-counts/compare/v1.5.2...4443018",
    ],
    [
      ["v1.5.2", "4443018"],
      "https://github.com/aklinker1/github-better-line-counts/compare/v1.5.2..4443018",
    ],
    [
      ["v1.7.7", "v1.8.0"],
      "https://github.com/aklinker1/github-better-line-counts/compare/v1.7.7...v1.8.0",
    ],
    // Branch names with slashes
    [
      ["main", "feat/breakdown-categories"],
      "https://github.com/aklinker1/github-better-line-counts/compare/main...feat/breakdown-categories",
    ],
    [
      ["release/1.0", "feat/foo/bar"],
      "https://github.com/aklinker1/github-better-line-counts/compare/release/1.0...feat/foo/bar/",
    ],
    // Cross-fork compare and the pull request creation page
    [
      ["main", "Kit-p:github-better-line-counts:feat/breakdown-categories"],
      "https://github.com/aklinker1/github-better-line-counts/compare/main...Kit-p:github-better-line-counts:feat/breakdown-categories?expand=1",
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
  ])("should return the compared refs based on the URL", (expected, url) => {
    const jsdom = new JSDOM("", { url });

    expect(getCurrentCompare(jsdom.window)).toEqual(expected);
  });
});
