import { GitAttributes } from "../gitattributes";
import { classifyFile, type Classifier } from "../classify";
import type { GithubApi } from "./api";
import type { DiffEntry, User } from "./types";

export interface GithubService {
  recalculateDiff(options: RecalculateOptions): Promise<RecalculateResult>;
  getUser(token: string): Promise<User>;
}

export function createGithubService(api: GithubApi): GithubService {
  const mountCache: { [mountId: number]: RecalculateResult } = {};

  /**
   * Returns the repo's `.gitattributes`, used to find files marked as `linguist-generated`.
   */
  async function getGitAttributes(options: {
    ref: string;
    repo: string;
    owner: string;
  }): Promise<GitAttributes | undefined> {
    const text = await api.getGitAttributesFile(options);
    if (text === undefined) {
      logger.debug("No .gitattributes file for this repo and commit");
      return undefined;
    }
    const gitAttributes = new GitAttributes(text);
    logger.debug("Git Attributes:");
    logger.debug(gitAttributes.text);
    logger.debug(gitAttributes.ast);
    return gitAttributes;
  }

  /**
   * The user's generated list, breakdown categories, and Linguist mappings, ready to classify
   * files with.
   */
  async function getClassifier(): Promise<Classifier> {
    const [customLists, categories, linguist] = await Promise.all([
      customListsStorage.getValue(),
      breakdownCategoriesStorage.getValue(),
      linguistMappingsStorage.getValue(),
    ]);
    return {
      generated: parsePatterns(customLists.all),
      categories: categories.map((category) => ({
        id: category.id,
        patterns: parsePatterns(category.patterns),
      })),
      linguist,
    };
  }

  /**
   * Get the commit hash for the current page. Used to look up gitattributes.
   */
  async function getCurrentCommit(
    options: RecalculateOptions,
  ): Promise<string> {
    if (options.type === "pr") {
      const fullPr = await api.getPr(options);
      logger.debug("Full PR:", fullPr);
      return fullPr.head.sha;
    }

    if (options.type === "commit") {
      const fullCommit = await api.getCommit(options);
      logger.debug("Full commit:", fullCommit);
      return fullCommit.sha;
    }

    if (options.type === "compare") {
      const fullCommit = await api.getCommit({
        ...options,
        ref: options.commitRefs[0],
      });
      logger.debug("Full base commit:", fullCommit);
      return fullCommit.sha;
    }

    throw Error(
      `Not implemented: getCurrentCommit(${JSON.stringify(options)})`,
    );
  }

  function calculateDiffForFiles(files: DiffEntry[]): DiffSummary {
    let changes = 0,
      additions = 0,
      deletions = 0;

    for (const file of files) {
      changes += file.changes;
      additions += file.additions;
      deletions += file.deletions;
    }

    return { changes, additions, deletions, files: files.length };
  }

  async function getChangedFiles(
    options: RecalculateOptions,
  ): Promise<DiffEntry[]> {
    if (options.type === "pr") return api.getAllPrFiles(options);

    if (options.type === "commit") {
      const commit = await api.getCommit(options);
      return commit.files;
    }

    if (options.type === "compare") {
      const comparison = await api.compareCommits(options);
      return comparison.files;
    }

    throw Error(`Not implemented: getChangedFiles(${JSON.stringify(options)})`);
  }

  function getCacheKey(
    currentRef: string,
    options: RecalculateOptions,
  ): string {
    if (options.type === "compare") {
      return `${options.commitRefs[0]}...${options.commitRefs[1]}`;
    }
    return currentRef;
  }

  return {
    async recalculateDiff(options) {
      // Cache the result if the same content script tries to get the result multiple times.
      const mounted = mountCache[options.mountId];
      if (mounted) {
        logger.debug("[recalculateDiff] Using mount cache");
        return mounted;
      }

      const ref = await getCurrentCommit(options);
      const cacheKey = getCacheKey(ref, options);
      const cached = await commitHashDiffsCache.get(cacheKey);
      if (cached) {
        logger.debug("[recalculateDiff] Using cached result");
        mountCache[options.mountId] = cached;
        return cached;
      }

      // 10s sleep for testing loading UI
      // await sleep(10e3);

      const [gitAttributes, changedFiles, classifier] = await Promise.all([
        getGitAttributes({ ...options, ref }),
        getChangedFiles(options),
        getClassifier(),
      ]);
      logger.debug(`Found ${changedFiles.length} files`);

      const include: DiffEntry[] = [];
      const exclude: DiffEntry[] = [];
      const categorized: Array<{ file: DiffEntry; categoryId?: string }> = [];

      changedFiles.forEach((diff) => {
        const attributes = gitAttributes?.evaluate(diff.filename).attributes;
        const classification = classifyFile(
          diff.filename,
          classifier,
          attributes,
        );
        logger.debug("Classified", diff.filename, classification);

        if (classification.kind === "generated") {
          exclude.push(diff);
          return;
        }
        include.push(diff);
        categorized.push({
          file: diff,
          categoryId:
            classification.kind === "category"
              ? classification.categoryId
              : undefined,
        });
      });

      const breakdown: Record<string, DiffSummary> = {};
      for (const { id } of classifier.categories) {
        breakdown[id] = calculateDiffForFiles(
          categorized
            .filter((entry) => entry.categoryId === id)
            .map((entry) => entry.file),
        );
      }

      const result: RecalculateResult = {
        all: calculateDiffForFiles(changedFiles),
        exclude: calculateDiffForFiles(exclude),
        include: calculateDiffForFiles(include),
        breakdown,
        other: calculateDiffForFiles(
          categorized
            .filter((entry) => entry.categoryId === undefined)
            .map((entry) => entry.file),
        ),
      };
      await commitHashDiffsCache.set(cacheKey, result, 2 * HOUR);

      mountCache[options.mountId] = result;
      return result;
    },

    getUser: api.getUser,
  };
}

// Types

export type RecalculateOptions =
  | RecalculatePrOptions
  | RecalculateCommitOptions
  | RecalculateCompareOptions;

export interface RecalculatePrOptions {
  mountId: number;
  type: "pr";
  owner: string;
  repo: string;
  pr: number;
}

export interface RecalculateCommitOptions {
  mountId: number;
  type: "commit";
  owner: string;
  repo: string;
  ref: string;
}

export interface RecalculateCompareOptions {
  mountId: number;
  type: "compare";
  owner: string;
  repo: string;
  commitRefs: [string, string];
}

export interface RecalculateResult {
  /**
   * Every changed file.
   */
  all: DiffSummary;
  /**
   * Files that are not generated. These are the numbers shown in place of GitHub's counts.
   */
  include: DiffSummary;
  /**
   * Generated files, subtracted from GitHub's counts.
   */
  exclude: DiffSummary;
  /**
   * Included files grouped by breakdown category id. Sums, together with `other`, to `include`.
   */
  breakdown: Record<string, DiffSummary>;
  /**
   * Included files that didn't match any breakdown category.
   */
  other: DiffSummary;
}

export interface DiffSummary {
  additions: number;
  deletions: number;
  changes: number;
  files: number;
}
