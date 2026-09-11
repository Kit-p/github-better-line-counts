/**
 * Format a line or file count the way GitHub does, with thousands separators ("2,015"). GitHub
 * uses the en-US style regardless of the browser locale, so the replacements match the page.
 */
const formatter = new Intl.NumberFormat("en-US");

export function formatCount(count: number): string {
  return formatter.format(count);
}
