import type { BreakdownCategory } from "./breakdown";
import { LINGUIST_ATTRIBUTES, type LinguistMappings } from "./linguist";
import type { CustomLists } from "./storage";

/**
 * Bumped when the exported shape changes incompatibly.
 */
export const SETTINGS_FORMAT_VERSION = 1;

/**
 * Everything the options page holds except the access token.
 */
export interface TransferableSettings {
  hideGeneratedLineCount: boolean;
  customLists: CustomLists;
  showBreakdown: boolean;
  breakdownCategories: BreakdownCategory[];
  linguistMappings: LinguistMappings;
}

export function serializeSettings(settings: TransferableSettings): string {
  return JSON.stringify(
    { githubBetterLineCounts: SETTINGS_FORMAT_VERSION, ...settings },
    null,
    2,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectBoolean(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") throw Error(`${name} must be true or false`);
  return value;
}

function expectString(value: unknown, name: string): string {
  if (typeof value !== "string") throw Error(`${name} must be a string`);
  return value;
}

/**
 * Parse and validate a file produced by `serializeSettings`. Throws an Error with a message fit
 * for display when the file is not usable.
 */
export function parseSettings(text: string): TransferableSettings {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw Error("not valid JSON");
  }
  if (!isRecord(data)) throw Error("expected a JSON object");
  if (data.githubBetterLineCounts !== SETTINGS_FORMAT_VERSION) {
    throw Error(
      `unsupported format version ${JSON.stringify(data.githubBetterLineCounts)}`,
    );
  }

  if (!isRecord(data.customLists)) throw Error('"customLists" is missing');
  const customLists: CustomLists = {
    all: expectString(data.customLists.all, "customLists.all"),
  };

  if (!Array.isArray(data.breakdownCategories)) {
    throw Error('"breakdownCategories" must be a list');
  }
  const breakdownCategories = data.breakdownCategories.map(
    (entry, index): BreakdownCategory => {
      const name = `breakdownCategories[${index}]`;
      if (!isRecord(entry)) throw Error(`${name} must be an object`);
      return {
        id: expectString(entry.id, `${name}.id`),
        name: expectString(entry.name, `${name}.name`),
        icon: expectString(entry.icon, `${name}.icon`),
        color: expectString(entry.color, `${name}.color`),
        patterns: expectString(entry.patterns, `${name}.patterns`),
      };
    },
  );
  const ids = new Set(breakdownCategories.map((category) => category.id));
  if (ids.size !== breakdownCategories.length) {
    throw Error("category ids must be unique");
  }

  if (!isRecord(data.linguistMappings)) {
    throw Error('"linguistMappings" is missing');
  }
  const mappings = data.linguistMappings;
  const linguistMappings = Object.fromEntries(
    LINGUIST_ATTRIBUTES.map((attribute) => [
      attribute,
      expectString(mappings[attribute], `linguistMappings.${attribute}`),
    ]),
  ) as LinguistMappings;

  return {
    hideGeneratedLineCount: expectBoolean(
      data.hideGeneratedLineCount,
      "hideGeneratedLineCount",
    ),
    customLists,
    showBreakdown: expectBoolean(data.showBreakdown, "showBreakdown"),
    breakdownCategories,
    linguistMappings,
  };
}
