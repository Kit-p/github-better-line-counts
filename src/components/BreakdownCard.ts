import "./BreakdownCard.css";
import type { BreakdownCategory } from "@/utils/breakdown";
import type { DiffSummary, RecalculateResult } from "@/utils/github";

export interface BreakdownRow {
  name: string;
  icon: string;
  color: string;
  summary: DiffSummary;
}

const BLOCK = "github-better-line-counts-breakdown";
const SHOW_DELAY_MS = 150;
const HIDE_DELAY_MS = 100;
const VIEWPORT_MARGIN_PX = 8;
const ANCHOR_GAP_PX = 6;

/**
 * Turn the recalculated stats and the user's categories into the rows shown in the card: the
 * categories in order, then "Other" for uncategorized files, then "Generated" for the files that
 * were subtracted from the counts. Rows without any files are skipped.
 */
export function getBreakdownRows(
  stats: RecalculateResult,
  categories: BreakdownCategory[],
): BreakdownRow[] {
  const rows: BreakdownRow[] = [];
  for (const category of categories) {
    const summary = stats.breakdown[category.id];
    if (!summary || summary.files === 0) continue;
    rows.push({
      name: category.name,
      icon: category.icon,
      color: category.color,
      summary,
    });
  }
  if (stats.other.files > 0) {
    rows.push({
      name: i18n.t("breakdown.other"),
      icon: "",
      color: OTHER_CATEGORY_COLOR,
      summary: stats.other,
    });
  }

  if (stats.exclude.files > 0) {
    rows.push({
      name: i18n.t("breakdown.generated"),
      icon: GENERATED_CATEGORY_ICON,
      color: GENERATED_CATEGORY_COLOR,
      summary: stats.exclude,
    });
  }
  return rows;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/**
 * Build the (initially hidden) card element.
 */
export function createBreakdownCard(rows: BreakdownRow[]): HTMLElement {
  const card = createElement("div", BLOCK);
  card.id = BREAKDOWN_CARD_ID;
  card.setAttribute("role", "tooltip");
  card.hidden = true;

  const totalChanges = rows.reduce((sum, row) => sum + row.summary.changes, 0);
  if (totalChanges > 0) {
    const bar = createElement("div", `${BLOCK}__bar`);
    for (const row of rows) {
      const segment = createElement("span", `${BLOCK}__segment`);
      segment.style.backgroundColor = row.color;
      segment.style.flexGrow = String(row.summary.changes);
      bar.append(segment);
    }
    card.append(bar);
  }

  // A table keeps every column aligned across rows regardless of how wide each number is.
  const table = createElement("table", `${BLOCK}__rows`);
  const body = document.createElement("tbody");
  for (const row of rows) {
    const line = createElement("tr", `${BLOCK}__row`);

    const swatchCell = createElement("td", `${BLOCK}__swatch-cell`);
    const swatch = createElement("span", `${BLOCK}__swatch`);
    swatch.style.backgroundColor = row.color;
    swatchCell.append(swatch);

    line.append(
      swatchCell,
      createElement("td", `${BLOCK}__icon`, row.icon),
      createElement("td", `${BLOCK}__name`, row.name),
      createElement(
        "td",
        `${BLOCK}__files`,
        i18n.t("breakdown.files", row.summary.files),
      ),
      createElement(
        "td",
        `${BLOCK}__additions`,
        i18n.t("diffs.additionsSymbol", [row.summary.additions]),
      ),
      createElement(
        "td",
        `${BLOCK}__deletions`,
        i18n.t("diffs.deletionsSymbol", [row.summary.deletions]),
      ),
    );
    body.append(line);
  }
  table.append(body);
  card.append(table);

  return card;
}

/**
 * The smallest rectangle containing all anchors, so the card can be centered on the whole
 * "+additions −deletions ⌁generated" cluster rather than on whichever element the pointer is over.
 */
function getUnionRect(anchors: HTMLElement[]) {
  const rects = anchors.map((anchor) => anchor.getBoundingClientRect());
  return {
    left: Math.min(...rects.map((rect) => rect.left)),
    right: Math.max(...rects.map((rect) => rect.right)),
    top: Math.min(...rects.map((rect) => rect.top)),
    bottom: Math.max(...rects.map((rect) => rect.bottom)),
  };
}

/**
 * Add the card to the page and show it while the pointer is over any of the anchors or the card
 * itself. Replaces any card left over from a previous mount.
 */
export function mountBreakdownCard(
  anchors: HTMLElement[],
  rows: BreakdownRow[],
): void {
  document.getElementById(BREAKDOWN_CARD_ID)?.remove();
  if (anchors.length === 0 || rows.length === 0) return;

  const card = createBreakdownCard(rows);
  document.body.append(card);

  let showTimeout: number | undefined;
  let hideTimeout: number | undefined;

  // Centered horizontally on the anchors and placed above them, falling back to below when there
  // is no room above.
  const position = () => {
    const union = getUnionRect(anchors);
    const width = card.offsetWidth;
    const height = card.offsetHeight;

    const centerX = (union.left + union.right) / 2;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN_PX;
    const left = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(centerX - width / 2, maxLeft),
    );

    const above = union.top - ANCHOR_GAP_PX - height;
    const top =
      above >= VIEWPORT_MARGIN_PX ? above : union.bottom + ANCHOR_GAP_PX;

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  };

  const show = () => {
    window.clearTimeout(hideTimeout);
    window.clearTimeout(showTimeout);
    showTimeout = window.setTimeout(() => {
      card.hidden = false;
      position();
    }, SHOW_DELAY_MS);
  };

  const hide = () => {
    window.clearTimeout(showTimeout);
    window.clearTimeout(hideTimeout);
    hideTimeout = window.setTimeout(() => {
      card.hidden = true;
    }, HIDE_DELAY_MS);
  };

  for (const anchor of anchors) {
    anchor.addEventListener("mouseenter", show);
    anchor.addEventListener("mouseleave", hide);
  }
  card.addEventListener("mouseenter", () => window.clearTimeout(hideTimeout));
  card.addEventListener("mouseleave", hide);
  window.addEventListener(
    "scroll",
    () => {
      card.hidden = true;
    },
    { passive: true },
  );
}
