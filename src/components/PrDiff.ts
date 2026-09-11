import { createDiffComponent, diffText } from "./createDiffComponent";

export const PrDiff = createDiffComponent({
  getAdditionsElement: () =>
    querySelectorFirst(
      // 2023
      "#diffstat .color-fg-success",
      // 2025-10-24
      "*[data-component=PH_Navigation] .f6.text-bold.fgColor-success",
    ),
  getDeletionsElement: () =>
    querySelectorFirst(
      // 2023
      "#diffstat .color-fg-danger",
      // 2025-10-24
      "*[data-component=PH_Navigation] .f6.text-bold.fgColor-danger",
    ),
  addSpinnerToPage(spinner) {
    // GitHub omits the deletions count when it is zero.
    (this.getDeletionsElement() ?? this.getAdditionsElement())?.after(spinner);
  },
  getAdditionsText: diffText.additions,
  getDeletionsText: diffText.deletions,
  getGeneratedText: diffText.generated,
});
