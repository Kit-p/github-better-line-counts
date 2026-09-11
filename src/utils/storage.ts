import {
  DEFAULT_BREAKDOWN_CATEGORIES,
  type BreakdownCategory,
} from "./breakdown";

export interface CustomLists {
  all: string;
}

export interface ExtensionStorageSchema {
  /**
   * The user's personal access token (PAT).
   */
  githubPat: string | null;
  /**
   * When `true`, don't show the generated line counts next to additions and subtractions.
   */
  hideGeneratedLineCount: boolean;
  /**
   * Glob patterns marking files as generated. Generated files are subtracted from the line counts.
   */
  customLists: CustomLists;
  /**
   * When `true`, show a breakdown of the non-generated lines by category when hovering over the
   * line counts.
   */
  showBreakdown: boolean;
  /**
   * Ordered list of categories used for the breakdown. Files are matched top to bottom and the
   * first match wins.
   */
  breakdownCategories: BreakdownCategory[];
}

export const githubPatStorage = storage.defineItem<string>("local:githubPat", {
  defaultValue: import.meta.env.VITE_DEFAULT_TOKEN ?? "",
});

export const hideGeneratedLineCountStorage = storage.defineItem<boolean>(
  "local:hideGeneratedLineCount",
  { defaultValue: false },
);

export const customListsStorage = storage.defineItem<CustomLists>(
  "local:customLists",
  {
    defaultValue: {
      all: DEFAULT_CUSTOM_LIST_ALL,
    },
  },
);

export const showBreakdownStorage = storage.defineItem<boolean>(
  "local:showBreakdown",
  { defaultValue: true },
);

export const breakdownCategoriesStorage = storage.defineItem<
  BreakdownCategory[]
>("local:breakdownCategories", {
  defaultValue: DEFAULT_BREAKDOWN_CATEGORIES,
});
