import { minimatch } from "minimatch";

const MINIMATCH_OPTIONS = {
  // Match files and directories that start with "."
  dot: true,
  // Treat a leading "!" literally instead of negating the whole pattern
  nonegate: true,
};

/**
 * Split a newline-separated list of glob patterns into individual patterns. Blank lines and lines
 * starting with `#` are ignored.
 */
export function parsePatterns(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

/**
 * Convert a user-facing pattern into a glob that minimatch understands. Patterns follow the same
 * conventions as `.gitignore` and `.gitattributes`:
 *
 * - A pattern matches at any depth unless it starts with `/`, which anchors it to the repo root.
 * - A pattern ending in `/` matches everything inside any directory with that name.
 */
export function toGlob(pattern: string): string {
  const glob = pattern.endsWith("/") ? `${pattern}**` : pattern;
  return glob.startsWith("/") ? glob.slice(1) : `**/${glob}`;
}

/**
 * Returns true if the file path (relative to the repo root, no leading slash) matches the pattern.
 */
export function matchesPattern(file: string, pattern: string): boolean {
  return minimatch(file, toGlob(pattern), MINIMATCH_OPTIONS);
}

/**
 * Returns true if the file path matches any of the patterns.
 */
export function matchesAnyPattern(file: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(file, pattern));
}
