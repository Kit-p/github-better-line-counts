import type { RecalculateResult } from "@/utils/github";
import { getBreakdownRows, mountBreakdownCard } from "./BreakdownCard";

/**
 * GitHub's older pages spell counts out ("12 additions") while its newer React pages use symbols
 * ("+12"). Returns true when the element currently shows the symbol form, so replacements can keep
 * whichever style the page uses.
 */
export function usesSymbolFormat(
  element: HTMLElement | null | undefined,
): boolean {
  return /^\s*[+\-−]/.test(element?.textContent ?? "");
}

export function createDiffComponent(options: {
  getAdditionsElement: () => HTMLElement | null | undefined;
  getDeletionsElement: () => HTMLElement | null | undefined;
  addSpinnerToPage: (spinner: HTMLElement) => void;
  /**
   * Text getters receive the element being replaced (the additions element for the generated
   * count) so they can match the page's existing format.
   */
  getAdditionsText: (
    count: number,
    element: HTMLElement | null | undefined,
  ) => string;
  getDeletionsText: (
    count: number,
    element: HTMLElement | null | undefined,
  ) => string;
  getGeneratedText: (
    count: number,
    element: HTMLElement | null | undefined,
  ) => string;
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
      const deletions = options.getDeletionsElement();
      const generatedText = options.getGeneratedText(
        stats.exclude.changes,
        additions,
      );

      if (additions)
        additions.textContent = options.getAdditionsText(
          stats.include.additions,
          additions,
        );
      if (deletions)
        deletions.textContent = options.getDeletionsText(
          stats.include.deletions,
          deletions,
        );

      let generated: HTMLElement | undefined;
      if (!hideGeneratedLineCount) {
        generated = document.createElement("strong");
        generated.id = DIFF_COMPONENT_ID;
        generated.textContent = " " + generatedText;
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
