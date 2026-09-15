// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBreakdownCard,
  getBreakdownRows,
  mountBreakdownCard,
} from "../BreakdownCard";
import {
  GENERATED_CATEGORY_COLOR,
  OTHER_CATEGORY_COLOR,
  type BreakdownCategory,
} from "@/utils/breakdown";
import type { DiffSummary, RecalculateResult } from "@/utils/github";
import { BREAKDOWN_CARD_ID } from "@/utils/constants";

vi.mock("#i18n", () => ({
  i18n: {
    t: (key: string, ...args: unknown[]) => {
      const subs = args.find((arg): arg is unknown[] => Array.isArray(arg));
      const count = args.find((arg): arg is number => typeof arg === "number");
      const sub = subs ? subs[0] : count;
      return sub === undefined ? key : `${key}:${sub}`;
    },
  },
}));

const summary = (
  additions: number,
  deletions: number,
  files: number,
): DiffSummary => ({
  additions,
  deletions,
  changes: additions + deletions,
  files,
});

const category = (
  id: string,
  overrides: Partial<BreakdownCategory> = {},
): BreakdownCategory => ({
  id,
  name: id,
  icon: "",
  color: "#000000",
  patterns: "",
  ...overrides,
});

const categories = [
  category("tests", { name: "Tests", icon: "🧪", color: "#111111" }),
  category("docs", { name: "Docs", icon: "📄", color: "#222222" }),
  category("empty", { name: "Empty", color: "#333333" }),
];

const stats: RecalculateResult = {
  all: summary(100, 20, 6),
  include: summary(80, 15, 4),
  exclude: summary(20, 5, 2),
  breakdown: {
    tests: summary(30, 5, 2),
    docs: summary(10, 0, 1),
    empty: summary(0, 0, 0),
  },
  other: summary(40, 10, 1),
  truncated: false,
};

/** jsdom normalizes colors, so compare against what it produces for the same input. */
function normalizeColor(color: string): string {
  const element = document.createElement("i");
  element.style.backgroundColor = color;
  return element.style.backgroundColor;
}

describe("getBreakdownRows", () => {
  it("should list categories with files in order, then other, then generated", () => {
    const rows = getBreakdownRows(stats, categories);

    expect(rows.map((row) => row.name)).toEqual([
      "Tests",
      "Docs",
      "breakdown.other",
      "breakdown.generated",
    ]);
    expect(rows[2]?.summary).toEqual(stats.other);
    expect(rows[3]).toMatchObject({
      icon: "⌁",
      color: GENERATED_CATEGORY_COLOR,
      summary: stats.exclude,
    });
  });

  it("should skip categories that are missing from the result", () => {
    const rows = getBreakdownRows(stats, [
      category("added-later"),
      ...categories,
    ]);

    expect(rows.map((row) => row.name)).toEqual([
      "Tests",
      "Docs",
      "breakdown.other",
      "breakdown.generated",
    ]);
  });

  it("should omit other and generated when they have no files", () => {
    const rows = getBreakdownRows(
      { ...stats, other: summary(0, 0, 0), exclude: summary(0, 0, 0) },
      categories,
    );

    expect(rows.map((row) => row.name)).toEqual(["Tests", "Docs"]);
  });

  it("should still show other and generated when no category matched", () => {
    const rows = getBreakdownRows(
      { ...stats, breakdown: { tests: summary(0, 0, 0) } },
      categories,
    );

    expect(rows.map((row) => row.name)).toEqual([
      "breakdown.other",
      "breakdown.generated",
    ]);
  });

  it("should show a lone other row when nothing else matched", () => {
    const rows = getBreakdownRows(
      {
        ...stats,
        breakdown: { tests: summary(0, 0, 0) },
        exclude: summary(0, 0, 0),
      },
      categories,
    );

    expect(rows.map((row) => row.name)).toEqual(["breakdown.other"]);
  });

  it("should return nothing when there are no files at all", () => {
    const empty = summary(0, 0, 0);
    const rows = getBreakdownRows(
      { ...stats, breakdown: {}, other: empty, exclude: empty },
      categories,
    );

    expect(rows).toEqual([]);
  });
});

describe("createBreakdownCard", () => {
  it("should render a hidden card with a proportional bar and one table row per entry", () => {
    const card = createBreakdownCard(getBreakdownRows(stats, categories));

    expect(card.id).toBe(BREAKDOWN_CARD_ID);
    expect(card.hidden).toBe(true);

    const segments = [
      ...card.querySelectorAll<HTMLElement>(
        ".github-better-line-counts-breakdown__segment",
      ),
    ];
    expect(segments.map((segment) => segment.style.flexGrow)).toEqual([
      "35",
      "10",
      "50",
      "25",
    ]);
    expect(segments.map((segment) => segment.style.backgroundColor)).toEqual(
      [
        "#111111",
        "#222222",
        OTHER_CATEGORY_COLOR,
        GENERATED_CATEGORY_COLOR,
      ].map(normalizeColor),
    );

    const rows = [
      ...card.querySelectorAll(
        "table tr.github-better-line-counts-breakdown__row",
      ),
    ];
    expect(rows.map((row) => row.textContent)).toEqual([
      "🧪Testsbreakdown.files:2diffs.additionsSymbol:30diffs.deletionsSymbol:5",
      "📄Docsbreakdown.files:1diffs.additionsSymbol:10diffs.deletionsSymbol:0",
      "breakdown.otherbreakdown.files:1diffs.additionsSymbol:40diffs.deletionsSymbol:10",
      "⌁breakdown.generatedbreakdown.files:2diffs.additionsSymbol:20diffs.deletionsSymbol:5",
    ]);
    // Every row has the same number of cells so the columns line up.
    expect(new Set(rows.map((row) => row.children.length))).toEqual(
      new Set([6]),
    );
  });

  it("should format counts with thousands separators", () => {
    const card = createBreakdownCard([
      {
        name: "Big",
        icon: "",
        color: "#000000",
        summary: summary(1234, 56789, 1000),
      },
    ]);

    expect(
      card.querySelector(".github-better-line-counts-breakdown__row")
        ?.textContent,
    ).toBe(
      "Bigbreakdown.files:1,000diffs.additionsSymbol:1,234diffs.deletionsSymbol:56,789",
    );
  });

  it("should not render a bar when there are no changes", () => {
    const card = createBreakdownCard([
      {
        name: "Renamed",
        icon: "",
        color: "#000000",
        summary: summary(0, 0, 3),
      },
    ]);

    expect(
      card.querySelector(".github-better-line-counts-breakdown__bar"),
    ).toBeNull();
    expect(
      card.querySelectorAll(".github-better-line-counts-breakdown__row"),
    ).toHaveLength(1);
  });
});

describe("mountBreakdownCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function rect(left: number, top: number, width: number, height: number) {
    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    } as DOMRect;
  }

  function mount(anchorRects = [rect(0, 0, 0, 0)]) {
    const anchors = anchorRects.map((anchorRect) => {
      const anchor = document.createElement("span");
      anchor.getBoundingClientRect = () => anchorRect;
      document.body.append(anchor);
      return anchor;
    });
    mountBreakdownCard(anchors, getBreakdownRows(stats, categories));
    const card = document.getElementById(BREAKDOWN_CARD_ID);
    if (!card) throw Error("Card was not mounted");
    // jsdom has no layout, so give the card a size.
    Object.defineProperty(card, "offsetWidth", { value: 200 });
    Object.defineProperty(card, "offsetHeight", { value: 50 });
    return { anchors, card };
  }

  function hover(anchor: HTMLElement) {
    anchor.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(150);
  }

  it("should show the card shortly after hovering an anchor and hide it after leaving", () => {
    const { anchors, card } = mount();
    const anchor = anchors[0]!;
    expect(card.hidden).toBe(true);

    anchor.dispatchEvent(new MouseEvent("mouseenter"));
    expect(card.hidden).toBe(true);
    vi.advanceTimersByTime(150);
    expect(card.hidden).toBe(false);

    anchor.dispatchEvent(new MouseEvent("mouseleave"));
    expect(card.hidden).toBe(false);
    vi.advanceTimersByTime(100);
    expect(card.hidden).toBe(true);
  });

  it("should keep the card open while the pointer moves from the anchor onto the card", () => {
    const { anchors, card } = mount();
    const anchor = anchors[0]!;

    hover(anchor);
    anchor.dispatchEvent(new MouseEvent("mouseleave"));
    card.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(1000);
    expect(card.hidden).toBe(false);

    card.dispatchEvent(new MouseEvent("mouseleave"));
    vi.advanceTimersByTime(100);
    expect(card.hidden).toBe(true);
  });

  it("should also show the card when hovering the text between the counts", () => {
    const sentence = document.createElement("p");
    const additions = document.createElement("strong");
    const deletions = document.createElement("strong");
    sentence.append("with ", additions, " and ", deletions, ".");
    document.body.append(sentence);
    mountBreakdownCard(
      [additions, deletions],
      getBreakdownRows(stats, categories),
    );
    const card = document.getElementById(BREAKDOWN_CARD_ID);
    if (!card) throw Error("Card was not mounted");

    sentence.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(150);
    expect(card.hidden).toBe(false);

    sentence.dispatchEvent(new MouseEvent("mouseleave"));
    vi.advanceTimersByTime(100);
    expect(card.hidden).toBe(true);
  });

  it("should not show the card when the pointer leaves before the delay", () => {
    const { anchors, card } = mount();
    const anchor = anchors[0]!;

    anchor.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(50);
    anchor.dispatchEvent(new MouseEvent("mouseleave"));
    vi.advanceTimersByTime(1000);
    expect(card.hidden).toBe(true);
  });

  it("should center the card above the whole group of anchors", () => {
    window.innerWidth = 1024;
    window.innerHeight = 768;
    // Two anchors spanning x 100..180, so the group is centered at 140.
    const { anchors, card } = mount([
      rect(100, 200, 40, 20),
      rect(150, 200, 30, 20),
    ]);

    // Hovering either anchor gives the same position.
    hover(anchors[1]!);

    expect(card.style.left).toBe("40px"); // 140 - 200 / 2
    expect(card.style.top).toBe("144px"); // 200 - 6 - 50
  });

  it("should ignore anchors that are not laid out", () => {
    window.innerWidth = 1024;
    window.innerHeight = 768;
    // A detached element reports an empty rectangle at the page origin.
    const { anchors, card } = mount([rect(100, 200, 40, 20), rect(0, 0, 0, 0)]);

    hover(anchors[0]!);

    expect(card.style.left).toBe("20px"); // 120 - 200 / 2
    expect(card.style.top).toBe("144px");
  });

  it("should fall back to below the anchors when there is no room above", () => {
    window.innerWidth = 1024;
    window.innerHeight = 768;
    const { anchors, card } = mount([rect(300, 10, 40, 20)]);

    hover(anchors[0]!);

    expect(card.style.top).toBe("36px"); // 10 + 20 + 6
  });

  it("should keep the card inside the viewport horizontally", () => {
    window.innerWidth = 1024;
    window.innerHeight = 768;
    const { anchors, card } = mount([rect(0, 200, 40, 20)]);

    hover(anchors[0]!);

    expect(card.style.left).toBe("8px");
  });

  it("should replace a card left over from a previous mount", () => {
    mount();
    mount();

    expect(document.querySelectorAll(`#${BREAKDOWN_CARD_ID}`)).toHaveLength(1);
  });

  it("should not mount anything without rows or anchors", () => {
    const anchor = document.createElement("span");
    mountBreakdownCard([anchor], []);
    mountBreakdownCard([], getBreakdownRows(stats, categories));

    expect(document.getElementById(BREAKDOWN_CARD_ID)).toBeNull();
  });
});
