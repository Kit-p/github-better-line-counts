import { describe, expect, it } from "vitest";
import {
  matchesAnyPattern,
  matchesPattern,
  parsePatterns,
  toGlob,
} from "../patterns";

describe("parsePatterns", () => {
  it("should trim whitespace and skip blank lines and comments", () => {
    const text = `
# Lockfiles
*.lock
  *-lock*  

  # trailing comment line
docs/
`;
    expect(parsePatterns(text)).toEqual(["*.lock", "*-lock*", "docs/"]);
  });

  it("should keep a # that is not at the start of the line", () => {
    expect(parsePatterns("foo#bar")).toEqual(["foo#bar"]);
  });
});

describe("toGlob", () => {
  it.each([
    ["*.md", "**/*.md"],
    ["docs/**", "**/docs/**"],
    ["/docs/**", "docs/**"],
    ["__tests__/", "**/__tests__/**"],
    ["/dist/", "dist/**"],
  ])("should convert %s to %s", (pattern, expected) => {
    expect(toGlob(pattern)).toBe(expected);
  });
});

describe("matchesPattern", () => {
  it.each([
    // Patterns without a slash match the basename at any depth
    ["foo.spec.ts", "*.spec.*"],
    ["src/foo.spec.ts", "*.spec.*"],
    ["README.md", "*.md"],
    ["docs/guide.md", "*.md"],
    ["packages/app/pnpm-lock.yaml", "*-lock*"],
    ["apps/api/Dockerfile", "Dockerfile"],
    // Dotfiles and dot directories are matched
    [".eslintrc.json", "*.json"],
    [".github/PULL_REQUEST_TEMPLATE.md", "*.md"],
    [".github/workflows/ci.yml", ".github/workflows/*.yml"],
    [".nvmrc", ".*rc"],
    // Patterns with a slash also match at any depth unless anchored
    ["docs/guide.md", "docs/**"],
    ["packages/app/docs/guide.md", "docs/**"],
    ["docs/guide.md", "/docs/**"],
    // A trailing slash matches everything inside the directory
    ["src/__tests__/foo.test.ts", "__tests__/"],
    ["src/__tests__/nested/foo.test.ts", "__tests__/"],
    // Braces and extglobs are supported
    [".github/workflows/ci.yaml", ".github/workflows/*.{yml,yaml}"],
    ["serverless.yml", "serverless.y?(a)ml"],
  ])("should match %s against %s", (file, pattern) => {
    expect(matchesPattern(file, pattern)).toBe(true);
  });

  it.each([
    ["Dockerfile.md", "Dockerfile"],
    ["src/foo.ts", "*.spec.*"],
    ["packages/app/docs/guide.md", "/docs/**"],
    ["src/__tests__", "__tests__/"],
    ["deadlock.ts", "*-lock*"],
    // A leading "!" is not treated as negation
    ["bar", "!foo"],
  ])("should not match %s against %s", (file, pattern) => {
    expect(matchesPattern(file, pattern)).toBe(false);
  });
});

describe("matchesAnyPattern", () => {
  it("should return true when any pattern matches", () => {
    expect(matchesAnyPattern("src/a.test.ts", ["*.md", "*.test.*"])).toBe(true);
  });

  it("should return false when no pattern matches", () => {
    expect(matchesAnyPattern("src/a.ts", ["*.md", "*.test.*"])).toBe(false);
  });

  it("should return false for an empty list", () => {
    expect(matchesAnyPattern("src/a.ts", [])).toBe(false);
  });
});
