import { minimatch } from "minimatch";

/**
 * Options that make minimatch behave like `.gitignore`. The one deliberate divergence is
 * case-insensitivity: ecosystems differ only in case ("Tests/" vs "tests/", "Migrations/" vs
 * "migrations/"), and a classification tool gains nothing from telling them apart.
 */
const MINIMATCH_OPTIONS = {
  // "*" matches files and directories that start with "."
  dot: true,
  nocase: true,
  // gitignore has neither brace expansion nor extglobs
  nobrace: true,
  noext: true,
  // Negation and comments are handled by parsePatterns, so minimatch sees literal text
  nonegate: true,
  nocomment: true,
};

export interface ParsedPattern {
  /**
   * The line as written by the user, for display.
   */
  source: string;
  /**
   * True for `!pattern` lines, which remove files matched by earlier lines.
   */
  negated: boolean;
  /**
   * The minimatch glob the line was converted to.
   */
  glob: string;
}

/**
 * Parse a newline-separated pattern list using `.gitignore` rules: blank lines and `#` comments
 * are skipped, a leading `!` negates, and a leading backslash escapes a literal `#` or `!`.
 */
export function parsePatterns(text: string): ParsedPattern[] {
  const patterns: ParsedPattern[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    let negated = false;
    let body = line;
    if (body.startsWith("!")) {
      negated = true;
      body = body.slice(1);
    } else if (body.startsWith("\\#") || body.startsWith("\\!")) {
      body = body.slice(1);
    }

    const glob = toGlob(body);
    if (glob === undefined) continue;
    patterns.push({ source: line, negated, glob });
  }
  return patterns;
}

/**
 * Convert a `.gitignore` pattern into a minimatch glob:
 *
 * - A pattern without a slash matches a file or directory name at any depth.
 * - A pattern with a slash anywhere else is anchored to the repository root. A leading slash only
 *   serves to anchor a bare name.
 * - A trailing slash matches everything inside a directory with that name.
 *
 * Returns undefined for patterns that can never match anything, like "/".
 */
export function toGlob(pattern: string): string | undefined {
  let glob = pattern;
  let directory = false;

  if (glob.endsWith("/")) {
    directory = true;
    glob = glob.slice(0, -1);
  }
  if (glob.startsWith("/")) {
    glob = glob.slice(1);
  }
  if (glob === "") return undefined;
  if (!glob.includes("/") && !pattern.startsWith("/")) {
    glob = `**/${glob}`;
  }

  return directory ? `${glob}/**` : glob;
}

/**
 * The last pattern in the list that matches the file, negated or not. As in `.gitignore`, later
 * lines override earlier ones. Undefined when nothing matches.
 */
export function findMatch(
  file: string,
  patterns: ParsedPattern[],
): ParsedPattern | undefined {
  let match: ParsedPattern | undefined;
  for (const pattern of patterns) {
    if (minimatch(file, pattern.glob, MINIMATCH_OPTIONS)) match = pattern;
  }
  return match;
}

/**
 * Returns true if the file path (relative to the repo root, no leading slash) is selected by the
 * list: the last matching line decides, and a negated line deselects.
 */
export function matchesPatterns(
  file: string,
  patterns: ParsedPattern[],
): boolean {
  const match = findMatch(file, patterns);
  return match !== undefined && !match.negated;
}

/**
 * Match a single `.gitattributes`-style pattern, which follows the same rules but cannot negate.
 */
export function matchesPattern(file: string, pattern: string): boolean {
  const glob = toGlob(pattern);
  return glob !== undefined && minimatch(file, glob, MINIMATCH_OPTIONS);
}
