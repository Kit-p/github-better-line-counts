import { createKeyValueCache } from "./cache";
import type { RecalculateResult } from "./github";

export const commitHashDiffsCache = createKeyValueCache<RecalculateResult>(
  "commit-hash-diffs-v2",
);

/**
 * Storage keys of caches from previous versions whose shape is no longer compatible. Removed when
 * the extension updates.
 */
export const LEGACY_CACHE_STORAGE_KEYS = [
  "local:@cache/commit-hash-diffs",
] as const;
