// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { usesSymbolFormat } from "../createDiffComponent";

function element(text: string): HTMLElement {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

describe("usesSymbolFormat", () => {
  it.each(["+458", " -233", "−12", "+2,015"])(
    "should detect the symbol form for %j",
    (text) => {
      expect(usesSymbolFormat(element(text))).toBe(true);
    },
  );

  it.each(["458 additions", "12 changed files", ""])(
    "should detect the text form for %j",
    (text) => {
      expect(usesSymbolFormat(element(text))).toBe(false);
    },
  );

  it("should treat a missing element as the text form", () => {
    expect(usesSymbolFormat(null)).toBe(false);
    expect(usesSymbolFormat(undefined)).toBe(false);
  });
});
