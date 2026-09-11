import { describe, expect, it } from "vitest";
import { classifyFile, type Classifier } from "../classify";
import { parsePatterns } from "../patterns";
import { DEFAULT_LINGUIST_MAPPINGS } from "../linguist";

const classifier: Classifier = {
  generated: parsePatterns("*.lock\n!keep.lock"),
  categories: [
    { id: "tests", patterns: parsePatterns("*.test.*\n__tests__/") },
    { id: "docs", patterns: parsePatterns("*.md") },
  ],
  linguist: DEFAULT_LINGUIST_MAPPINGS,
};

describe("classifyFile", () => {
  it("should subtract files matched by the generated list", () => {
    expect(classifyFile("bun.lock", classifier)).toEqual({
      kind: "generated",
      via: { pattern: "*.lock" },
    });
  });

  it("should honor a negated line in the generated list", () => {
    expect(classifyFile("keep.lock", classifier)).toMatchObject({
      kind: "other",
    });
  });

  it("should pick the first category whose patterns match", () => {
    expect(classifyFile("src/__tests__/README.md", classifier)).toEqual({
      kind: "category",
      categoryId: "tests",
      via: { pattern: "__tests__/" },
    });
    expect(classifyFile("README.md", classifier)).toEqual({
      kind: "category",
      categoryId: "docs",
      via: { pattern: "*.md" },
    });
  });

  it("should fall back to other", () => {
    expect(classifyFile("src/index.ts", classifier)).toEqual({ kind: "other" });
  });

  it("should subtract files whose attribute maps to generated", () => {
    expect(
      classifyFile("src/index.ts", classifier, { "linguist-vendored": true }),
    ).toEqual({ kind: "generated", via: { attribute: "linguist-vendored" } });
  });

  it("should let an attribute mapped to a category beat the pattern order", () => {
    expect(
      classifyFile("src/a.test.ts", classifier, {
        "linguist-documentation": true,
      }),
    ).toEqual({
      kind: "category",
      categoryId: "docs",
      via: { attribute: "linguist-documentation" },
    });
  });

  it("should ignore an attribute mapped to a category that no longer exists", () => {
    const withoutDocs: Classifier = {
      ...classifier,
      categories: classifier.categories.filter((c) => c.id !== "docs"),
    };

    expect(
      classifyFile("guide.txt", withoutDocs, {
        "linguist-documentation": true,
      }),
    ).toEqual({ kind: "other" });
  });

  it("should ignore attributes explicitly set to false", () => {
    expect(
      classifyFile("src/index.ts", classifier, {
        "linguist-generated": false,
      }),
    ).toEqual({ kind: "other" });
  });
});
