import { createDiffComponent, usesSymbolFormat } from "./createDiffComponent";

export const CommitDiff = createDiffComponent({
  getAdditionsElement: () =>
    querySelectorFirst(
      // 2023
      "#toc>*>strong:nth-child(2)",
      // 2026-09: the "N files changed +X -Y" summary in the commit page header. It sits outside
      // the diff list, whose file headers use the same color classes.
      "[class*=commitFilesChangedContainer] .fgColor-success",
      "[data-component='PageHeader.Description'] .f6.text-bold.fgColor-success",
    ),
  getDeletionsElement: () =>
    querySelectorFirst(
      // 2023
      "#toc>*>strong:nth-child(3)",
      // 2026-09
      "[class*=commitFilesChangedContainer] .fgColor-danger",
      "[data-component='PageHeader.Description'] .f6.text-bold.fgColor-danger",
    ),
  addSpinnerToPage(spinner) {
    // GitHub omits the deletions count when it is zero.
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
  // In text form the count is inserted into a sentence: "... and 3 deletions (12 generated)."
  getGeneratedText: (count, element) =>
    usesSymbolFormat(element)
      ? i18n.t("diffs.generatedSymbol", [count])
      : i18n.t("diffs.generatedTextInline", [count]),
});
