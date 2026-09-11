/**
 * The boolean Linguist attributes a repository can set in `.gitattributes`. Each one is mapped in
 * the options page to what the extension should do with files carrying it.
 */
export const LINGUIST_ATTRIBUTES = [
  "linguist-generated",
  "linguist-vendored",
  "linguist-documentation",
] as const;

export type LinguistAttribute = (typeof LINGUIST_ATTRIBUTES)[number];

/**
 * Subtract the file from the counts, like the generated list does.
 */
export const LINGUIST_TARGET_GENERATED = "generated";

/**
 * Leave the file to the pattern lists.
 */
export const LINGUIST_TARGET_NONE = "none";

/**
 * Where files with a given attribute go: `LINGUIST_TARGET_GENERATED`, `LINGUIST_TARGET_NONE`, or a
 * breakdown category id. Category ids are UUIDs or seed ids, so they never collide with the two
 * constants.
 */
export type LinguistMappings = Record<LinguistAttribute, string>;

export const DEFAULT_LINGUIST_MAPPINGS: LinguistMappings = {
  "linguist-generated": LINGUIST_TARGET_GENERATED,
  "linguist-vendored": LINGUIST_TARGET_GENERATED,
  "linguist-documentation": "docs",
};
