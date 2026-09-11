import { describe, expect, it } from "vitest";
import { formatCount } from "../formatCount";

describe("formatCount", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1,000"],
    [2015, "2,015"],
    [1234567, "1,234,567"],
  ])("should format %d as %s", (count, expected) => {
    expect(formatCount(count)).toBe(expected);
  });
});
