import type { RecalculateResult } from "@/utils/github";
import { getBreakdownRows, mountBreakdownCard } from "./BreakdownCard";

export function createDiffComponent(options: {
  getAdditionsElement: () => HTMLElement | null | undefined;
  getDeletionsElement: () => HTMLElement | null | undefined;
  addSpinnerToPage: (spinner: HTMLElement) => void;
  getAdditionsText: (count: number) => string;
  getDeletionsText: (count: number) => string;
  getGeneratedText: (count: number) => string;
}): (statsPromise: Promise<RecalculateResult>) => Promise<void> {
  return async (statsPromise) => {
    const hideGeneratedLineCountPromise =
      hideGeneratedLineCountStorage.getValue();
    const showBreakdownPromise = showBreakdownStorage.getValue();
    const categoriesPromise = breakdownCategoriesStorage.getValue();

    const spinner = Spinner(GREY_COLOR);
    spinner.id = DIFF_COMPONENT_ID;
    options.addSpinnerToPage(spinner);
    const hideSpinner = () => {
      spinner.style.display = "none";
    };

    // Wait for calculation and settings to load

    try {
      const [stats, hideGeneratedLineCount, showBreakdown, categories] =
        await Promise.all([
          statsPromise,
          hideGeneratedLineCountPromise,
          showBreakdownPromise,
          categoriesPromise,
        ]);

      // Render new counts

      const additions = options.getAdditionsElement();
      if (additions)
        additions.textContent = options.getAdditionsText(
          stats.include.additions,
        );

      const deletions = options.getDeletionsElement();
      if (deletions)
        deletions.textContent = options.getDeletionsText(
          stats.include.deletions,
        );

      let generated: HTMLElement | undefined;
      if (!hideGeneratedLineCount) {
        generated = document.createElement("strong");
        generated.id = DIFF_COMPONENT_ID;
        generated.textContent =
          " " + options.getGeneratedText(stats.exclude.changes);
        generated.style.color = GREY_COLOR;
        generated.classList.add(
          ...[...(additions?.classList ?? [])].filter(
            (className) => !className.toLowerCase().includes("fg"),
          ),
        );
        const generatedAdditionsText = i18n.t("diffs.additionsSymbol", [
          stats.exclude.additions,
        ]);
        const generatedDeletionsText = i18n.t("diffs.deletionsSymbol", [
          stats.exclude.deletions,
        ]);
        generated.title = `${generatedAdditionsText} ${generatedDeletionsText}`;
        spinner.replaceWith(generated);
      } else {
        hideSpinner();
      }

      // Show the breakdown of the non-generated lines when hovering over any of the counts

      if (showBreakdown) {
        const anchors = [additions, deletions, generated].filter(
          (element): element is HTMLElement => !!element,
        );
        mountBreakdownCard(anchors, getBreakdownRows(stats, categories));
      }
    } catch (err) {
      hideSpinner();
      logger.debug("Failed to calculate diff:", err);
    }
  };
}
