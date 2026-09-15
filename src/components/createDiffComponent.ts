import { FILES_PAGE_SIZE, type RecalculateResult } from "@/utils/github";
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

type CountText = (
  count: number,
  element: HTMLElement | null | undefined,
) => string;

/**
 * Replacement text for the counts, in the format the element already uses. In text form the
 * generated count is inserted into a sentence ("... and 90 deletions (400 generated)."), so it is
 * parenthesized.
 */
export const diffText = {
  additions: ((count, element) =>
    usesSymbolFormat(element)
      ? i18n.t("diffs.additionsSymbol", [formatCount(count)])
      : i18n.t("diffs.additionsText", count, [
          formatCount(count),
        ])) as CountText,
  deletions: ((count, element) =>
    usesSymbolFormat(element)
      ? i18n.t("diffs.deletionsSymbol", [formatCount(count)])
      : i18n.t("diffs.deletionsText", count, [
          formatCount(count),
        ])) as CountText,
  generated: ((count, element) =>
    usesSymbolFormat(element)
      ? i18n.t("diffs.generatedSymbol", [formatCount(count)])
      : i18n.t("diffs.generatedTextInline", [formatCount(count)])) as CountText,
};

export function createDiffComponent(options: {
  getAdditionsElement: () => HTMLElement | null | undefined;
  getDeletionsElement: () => HTMLElement | null | undefined;
  addSpinnerToPage: (spinner: HTMLElement) => void;
  /**
   * Text getters receive the element being replaced (the additions element for the generated
   * count) so they can match the page's existing format.
   */
  getAdditionsText: CountText;
  getDeletionsText: CountText;
  getGeneratedText: CountText;
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

      const additions = options.getAdditionsElement();
      const deletions = options.getDeletionsElement();

      // With only part of the file list, no number would be right. Leave the page alone and say
      // why in place of the generated count.
      if (stats.truncated) {
        const note = document.createElement("strong");
        note.id = DIFF_COMPONENT_ID;
        note.textContent = " " + i18n.t("diffs.truncated");
        note.title = i18n.t("diffs.truncatedTitle", [String(FILES_PAGE_SIZE)]);
        note.style.color = GREY_COLOR;
        note.classList.add(
          ...[...(additions?.classList ?? [])].filter(
            (className) => !className.toLowerCase().includes("fg"),
          ),
        );
        spinner.replaceWith(note);
        return;
      }

      // Render new counts

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
          formatCount(stats.exclude.additions),
        ]);
        const generatedDeletionsText = i18n.t("diffs.deletionsSymbol", [
          formatCount(stats.exclude.deletions),
        ]);
        generated.title = `${generatedAdditionsText} ${generatedDeletionsText}`;
        spinner.replaceWith(generated);
      } else {
        hideSpinner();
      }

      // Show the breakdown of the non-generated lines when hovering over any of the counts

      if (showBreakdown) {
        // The generated element is only in the page when the spinner found a spot.
        const anchors = [additions, deletions, generated].filter(
          (element): element is HTMLElement => !!element?.isConnected,
        );
        mountBreakdownCard(anchors, getBreakdownRows(stats, categories));
      }
    } catch (err) {
      hideSpinner();
      logger.debug("Failed to calculate diff:", err);
    }
  };
}
