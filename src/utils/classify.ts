import { findMatch, matchesPatterns, type ParsedPattern } from "./patterns";
import {
  LINGUIST_ATTRIBUTES,
  LINGUIST_TARGET_GENERATED,
  type LinguistAttribute,
  type LinguistMappings,
} from "./linguist";

export interface ClassifierCategory {
  id: string;
  patterns: ParsedPattern[];
}

/**
 * Everything needed to decide where a file goes, with pattern lists already parsed.
 */
export interface Classifier {
  generated: ParsedPattern[];
  /**
   * In match order: the first category whose patterns select the file wins.
   */
  categories: ClassifierCategory[];
  linguist: LinguistMappings;
}

/**
 * How a decision was reached, for logging and the options page's path tester.
 */
export type ClassificationVia =
  | { attribute: LinguistAttribute }
  | { pattern: string };

export type Classification =
  | { kind: "generated"; via: ClassificationVia }
  | { kind: "category"; categoryId: string; via: ClassificationVia }
  | { kind: "other" };

/**
 * Decide where a file goes. Attributes the repository set in `.gitattributes` take precedence over
 * the pattern lists, since they are the repository's own declaration:
 *
 * 1. an attribute mapped to "generated", then the generated patterns;
 * 2. an attribute mapped to an existing category, then the categories' patterns in order;
 * 3. otherwise "other".
 */
export function classifyFile(
  file: string,
  classifier: Classifier,
  attributes: Record<string, unknown> = {},
): Classification {
  const setAttributes = LINGUIST_ATTRIBUTES.filter(
    (attribute) => attributes[attribute] === true,
  );

  const generatedAttribute = setAttributes.find(
    (attribute) => classifier.linguist[attribute] === LINGUIST_TARGET_GENERATED,
  );
  if (generatedAttribute) {
    return { kind: "generated", via: { attribute: generatedAttribute } };
  }
  const generatedMatch = findMatch(file, classifier.generated);
  if (generatedMatch && !generatedMatch.negated) {
    return { kind: "generated", via: { pattern: generatedMatch.source } };
  }

  for (const attribute of setAttributes) {
    const target = classifier.linguist[attribute];
    if (classifier.categories.some((category) => category.id === target)) {
      return { kind: "category", categoryId: target, via: { attribute } };
    }
  }
  for (const category of classifier.categories) {
    if (matchesPatterns(file, category.patterns)) {
      const match = findMatch(file, category.patterns);
      return {
        kind: "category",
        categoryId: category.id,
        via: { pattern: match?.source ?? "" },
      };
    }
  }

  return { kind: "other" };
}
