import { createDiffComponent, usesSymbolFormat } from "./createDiffComponent";

export const CompareDiff = createDiffComponent({
  getAdditionsElement: () =>
    querySelectorFirst(
      // 2023, still used by compare pages in 2026-09
      [".toc-diff-stats>strong", 0],
    ),
  getDeletionsElement: () =>
    querySelectorFirst(
      // 2023
      [".toc-diff-stats>strong", 1],
    ),
  addSpinnerToPage(spinner) {
    // Right after the deletions count, so the generated count lands inside the sentence:
    // "Showing 35 changed files with 1992 additions and 90 deletions (400 generated)."
    (this.getDeletionsElement() ?? this.getAdditionsElement())?.after(spinner);
  },
  getAdditionsText: (count, element) =>
    usesSymbolFormat(element)
      ? i18n.t("diffs.additionsSymbol", [count])
      : i18n.t("diffs.additionsText", count),
  getDeletionsText: (count, element) =>
    usesSymbolFormat(element)
      ? i18n.t("diffs.deletionsSymbol", [count])
      : i18n.t("diffs.deletionsText", count),
  getGeneratedText: (count, element) =>
    usesSymbolFormat(element)
      ? i18n.t("diffs.generatedSymbol", [count])
      : i18n.t("diffs.generatedTextInline", [count]),
});
