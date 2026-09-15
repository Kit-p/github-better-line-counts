// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { findCompareStat } from "../CompareDiff";

describe("findCompareStat", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should find the counts when the file count is a button", () => {
    document.body.innerHTML = `<div class="toc-diff-stats">
      <button>12 changed files</button> with
      <strong>117 additions</strong> and <strong>25 deletions</strong>.
    </div>`;

    expect(findCompareStat(/\baddition/i)?.textContent).toBe("117 additions");
    expect(findCompareStat(/\bdeletion/i)?.textContent).toBe("25 deletions");
  });

  it("should skip the file count when it is a strong element too", () => {
    document.body.innerHTML = `<div class="toc-diff-stats">
      Showing <strong>425 changed files</strong> with
      <strong>24,233 additions</strong> and <strong>10,552 deletions</strong>.
    </div>`;

    expect(findCompareStat(/\baddition/i)?.textContent).toBe(
      "24,233 additions",
    );
    expect(findCompareStat(/\bdeletion/i)?.textContent).toBe(
      "10,552 deletions",
    );
  });

  it("should handle a single addition or deletion", () => {
    document.body.innerHTML = `<div class="toc-diff-stats">
      <strong>1 changed file</strong> with <strong>1 addition</strong> and <strong>1 deletion</strong>.
    </div>`;

    expect(findCompareStat(/\baddition/i)?.textContent).toBe("1 addition");
    expect(findCompareStat(/\bdeletion/i)?.textContent).toBe("1 deletion");
  });

  it("should return undefined on pages without the summary", () => {
    expect(findCompareStat(/\baddition/i)).toBeUndefined();
  });
});
