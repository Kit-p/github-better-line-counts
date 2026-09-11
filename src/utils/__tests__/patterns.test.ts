import { describe, expect, it } from "vitest";
import {
  findMatch,
  matchesPattern,
  matchesPatterns,
  parsePatterns,
  toGlob,
} from "../patterns";

describe("parsePatterns", () => {
  it("should trim whitespace and skip blank lines and comments", () => {
    const text = `
# Lockfiles
*.lock
  *-lock.*  

  # trailing comment line
docs/
`;
    expect(parsePatterns(text).map((p) => p.source)).toEqual([
      "*.lock",
      "*-lock.*",
      "docs/",
    ]);
  });

  it("should mark negated lines", () => {
    expect(parsePatterns("*.md\n!README.md")).toMatchObject([
      { source: "*.md", negated: false, glob: "**/*.md" },
      { source: "!README.md", negated: true, glob: "**/README.md" },
    ]);
  });

  it("should treat an escaped leading # or ! literally", () => {
    expect(parsePatterns("\\#hash.txt\n\\!bang.txt")).toMatchObject([
      { negated: false, glob: "**/#hash.txt" },
      { negated: false, glob: "**/!bang.txt" },
    ]);
  });

  it("should drop patterns that cannot match anything", () => {
    expect(parsePatterns("/\n!\n//")).toEqual([]);
  });
});

describe("toGlob", () => {
  it.each([
    // No slash: any depth
    ["*.md", "**/*.md"],
    ["Dockerfile", "**/Dockerfile"],
    ["__tests__/", "**/__tests__/**"],
    // A slash anywhere else anchors to the root
    ["docs/**", "docs/**"],
    ["db/migrate/", "db/migrate/**"],
    [".github/workflows/*.yml", ".github/workflows/*.yml"],
    ["/dist/", "dist/**"],
    ["/README.md", "README.md"],
    // Explicit any-depth prefix passes through
    ["**/src/test/", "**/src/test/**"],
  ])("should convert %s to %s", (pattern, expected) => {
    expect(toGlob(pattern)).toBe(expected);
  });
});

describe("matchesPattern", () => {
  it.each([
    // Bare names match at any depth
    ["foo.spec.ts", "*.spec.*"],
    ["src/foo.spec.ts", "*.spec.*"],
    ["docs/guide.md", "*.md"],
    ["packages/app/pnpm-lock.yaml", "*-lock.*"],
    ["apps/api/Dockerfile", "Dockerfile"],
    ["src/__tests__/nested/foo.test.ts", "__tests__/"],
    // Dotfiles and dot directories are matched
    [".eslintrc.json", "*.json"],
    [".github/PULL_REQUEST_TEMPLATE.md", "*.md"],
    [".nvmrc", ".*rc"],
    // Slashes anchor to the root
    ["docs/guide.md", "docs/**"],
    [".github/workflows/ci.yml", ".github/workflows/*.yml"],
    ["dist/index.js", "/dist/"],
    ["README.md", "/README.md"],
    // "**" works in the middle and as an explicit prefix
    ["packages/app/docs/guide.md", "**/docs/**"],
    ["a/x/y/b.txt", "a/**/b.txt"],
    ["a/b.txt", "a/**/b.txt"],
    // Case-insensitive
    ["Dockerfile", "dockerfile"],
    ["src/Migrations/001.cs", "migrations/"],
    ["Tests/AppTests/FooTests.swift", "tests/"],
    // Single-character and class wildcards
    ["file1.txt", "file?.txt"],
    ["main.c", "*.[ch]"],
  ])("should match %s against %s", (file, pattern) => {
    expect(matchesPattern(file, pattern)).toBe(true);
  });

  it.each([
    ["Dockerfile.md", "Dockerfile"],
    ["src/foo.ts", "*.spec.*"],
    ["src/__tests__", "__tests__/"],
    ["deadlock.ts", "*-lock.*"],
    // Anchored patterns do not match deeper copies
    ["packages/app/docs/guide.md", "docs/**"],
    ["pkg/.github/workflows/ci.yml", ".github/workflows/*.yml"],
    ["src/dist/index.js", "/dist/"],
    ["docs/README.md", "/README.md"],
    // gitignore has no brace expansion or extglobs
    ["ci.yml", "*.{yml,yaml}"],
    ["serverless.yml", "serverless.y?(a)ml"],
  ])("should not match %s against %s", (file, pattern) => {
    expect(matchesPattern(file, pattern)).toBe(false);
  });
});

describe("matchesPatterns", () => {
  it("should let the last matching line decide", () => {
    const patterns = parsePatterns("*.md\n!README.md");

    expect(matchesPatterns("docs/guide.md", patterns)).toBe(true);
    expect(matchesPatterns("README.md", patterns)).toBe(false);
    expect(matchesPatterns("docs/README.md", patterns)).toBe(false);
  });

  it("should re-select a file negated by an earlier line", () => {
    const patterns = parsePatterns("*.md\n!README.md\n/README.md");

    expect(matchesPatterns("README.md", patterns)).toBe(true);
    expect(matchesPatterns("docs/README.md", patterns)).toBe(false);
  });

  it("should not select a file that only matches a negated line", () => {
    expect(matchesPatterns("README.md", parsePatterns("!README.md"))).toBe(
      false,
    );
  });

  it("should return false for an empty list", () => {
    expect(matchesPatterns("src/a.ts", [])).toBe(false);
  });
});

describe("findMatch", () => {
  it("should report the deciding line", () => {
    const patterns = parsePatterns("*.md\n!README.md");

    expect(findMatch("README.md", patterns)?.source).toBe("!README.md");
    expect(findMatch("docs/guide.md", patterns)?.source).toBe("*.md");
    expect(findMatch("src/a.ts", patterns)).toBeUndefined();
  });
});
