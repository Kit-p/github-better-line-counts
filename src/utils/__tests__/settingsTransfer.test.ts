import { describe, expect, it } from "vitest";
import {
  parseSettings,
  serializeSettings,
  type TransferableSettings,
} from "../settingsTransfer";
import { DEFAULT_BREAKDOWN_CATEGORIES } from "../breakdown";
import { DEFAULT_LINGUIST_MAPPINGS } from "../linguist";

const settings: TransferableSettings = {
  hideGeneratedLineCount: false,
  customLists: { all: "*.lock" },
  showBreakdown: true,
  breakdownCategories: DEFAULT_BREAKDOWN_CATEGORIES.slice(0, 2),
  linguistMappings: DEFAULT_LINGUIST_MAPPINGS,
};

describe("settings transfer", () => {
  it("should round-trip through JSON", () => {
    const text = serializeSettings(settings);

    expect(JSON.parse(text).githubBetterLineCounts).toBe(1);
    expect(parseSettings(text)).toEqual(settings);
  });

  it("should ignore unknown extra fields", () => {
    const data = { ...JSON.parse(serializeSettings(settings)), extra: 1 };

    expect(parseSettings(JSON.stringify(data))).toEqual(settings);
  });

  it.each([
    ["not json", "not valid JSON"],
    ["[]", "expected a JSON object"],
    ["{}", "unsupported format version undefined"],
    [
      JSON.stringify({ githubBetterLineCounts: 2 }),
      "unsupported format version 2",
    ],
    [JSON.stringify({ githubBetterLineCounts: 1 }), '"customLists" is missing'],
    [
      JSON.stringify({
        ...JSON.parse(serializeSettings(settings)),
        breakdownCategories: [{ id: "a" }],
      }),
      "breakdownCategories[0].name must be a string",
    ],
    [
      JSON.stringify({
        ...JSON.parse(serializeSettings(settings)),
        breakdownCategories: [
          settings.breakdownCategories[0],
          settings.breakdownCategories[0],
        ],
      }),
      "category ids must be unique",
    ],
    [
      JSON.stringify({
        ...JSON.parse(serializeSettings(settings)),
        linguistMappings: { "linguist-generated": "generated" },
      }),
      "linguistMappings.linguist-vendored must be a string",
    ],
    [
      JSON.stringify({
        ...JSON.parse(serializeSettings(settings)),
        showBreakdown: "yes",
      }),
      "showBreakdown must be true or false",
    ],
  ])("should reject %s", (text, message) => {
    expect(() => parseSettings(text)).toThrow(message);
  });
});
