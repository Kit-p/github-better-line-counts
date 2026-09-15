import { createDiffComponent, diffText } from "./createDiffComponent";

/**
 * The count in the compare page summary whose text ends with the given word. The summary reads
 * "Showing N changed files with X additions and Y deletions."; the file count is a button on small
 * comparisons but a <strong> on large ones, so the counts cannot be picked by position.
 */
export function findCompareStat(word: RegExp): HTMLElement | undefined {
  return [
    ...document.querySelectorAll<HTMLElement>(".toc-diff-stats>strong"),
  ].find((element) => word.test(element.textContent ?? ""));
}

export const CompareDiff = createDiffComponent({
  getAdditionsElement: () => findCompareStat(/\baddition/i),
  getDeletionsElement: () => findCompareStat(/\bdeletion/i),
  addSpinnerToPage(spinner) {
    // Right after the deletions count, so the generated count lands inside the sentence:
    // "Showing 35 changed files with 1,992 additions and 90 deletions (400 generated)."
    (this.getDeletionsElement() ?? this.getAdditionsElement())?.after(spinner);
  },
  getAdditionsText: diffText.additions,
  getDeletionsText: diffText.deletions,
  getGeneratedText: diffText.generated,
});
