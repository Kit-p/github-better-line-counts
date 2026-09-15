import { FetchError, ofetch } from "ofetch";
import type {
  Commit,
  Comparison,
  DiffEntry,
  EncodedFile,
  PullRequest,
  Repository,
  User,
} from "./types";

/**
 * GitHub returns at most this many files per request. Commits page beyond it; comparisons stop
 * there for good.
 */
export const FILES_PAGE_SIZE = 300;

/**
 * Commit file lists are paginated up to 3,000 files.
 */
const MAX_FILE_PAGES = 10;

export function createGithubApi() {
  /**
   * Fetch with some default headers and authentication.
   */
  const fetch = ofetch.create({
    baseURL: "https://api.github.com",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github+json",
    },
    async onRequest(ctx) {
      if (ctx.options.headers.has("Authorization")) return;

      // Only authenticate when a token is set. GitHub rejects an empty bearer token with a 401
      // instead of treating the request as anonymous.
      const token = await githubPatStorage.getValue();
      if (token) ctx.options.headers.set("Authorization", `Bearer ${token}`);
    },
  });

  return {
    /**
     * Throws an error if the PAT is not valid
     */
    async getUser(token: string): Promise<User> {
      return await fetch<User>("/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },

    /**
     * Returns the repo's git attributes, or undefined if the file does not exist
     */
    async getGitAttributesFile(options: {
      owner: string;
      repo: string;
      ref: string;
    }): Promise<string | undefined> {
      try {
        const encodedFile = await fetch<EncodedFile>(
          `/repos/${options.owner}/${options.repo}/contents/.gitattributes`,
          {
            query: {
              ref: options.ref,
            },
          },
        );
        logger.debug(encodedFile);
        return atob(encodedFile.content);
      } catch (err) {
        if (err instanceof FetchError && err.statusCode === 404) {
          return undefined;
        } else {
          throw err;
        }
      }
    },

    /**
     * Load information about a repository, mainly its default branch.
     */
    async getRepo(options: {
      owner: string;
      repo: string;
    }): Promise<Repository> {
      return await fetch<Repository>(`/repos/${options.owner}/${options.repo}`);
    },

    /**
     * Load information about a PR.
     */
    async getPr(options: {
      owner: string;
      repo: string;
      pr: number;
    }): Promise<PullRequest> {
      return await fetch<PullRequest>(
        `/repos/${options.owner}/${options.repo}/pulls/${options.pr}`,
      );
    },

    /**
     * Load information about a commit, including every changed file. GitHub paginates the file
     * list when a commit touches more than `FILES_PAGE_SIZE` files.
     */
    async getCommit(options: {
      owner: string;
      repo: string;
      ref: string;
    }): Promise<Commit> {
      const url = `/repos/${options.owner}/${options.repo}/commits/${options.ref}`;
      const commit = await fetch<Commit>(url);

      let lastPage = commit.files;
      let page = 1;
      while (lastPage.length >= FILES_PAGE_SIZE && page < MAX_FILE_PAGES) {
        page++;
        logger.debug("Fetching commit files page:", page);
        lastPage = (await fetch<Commit>(`${url}?page=${page}`)).files;
        commit.files = [...commit.files, ...lastPage];
      }
      return commit;
    },

    /**
     * Load all files in a PR.
     */
    async getAllPrFiles(options: {
      owner: string;
      repo: string;
      pr: number;
    }): Promise<DiffEntry[]> {
      const results: DiffEntry[] = [];
      let pageResults: DiffEntry[] = [];
      let page = 1;
      const perPage = 100;

      do {
        logger.debug("Fetching PR page:", page);
        // TODO: reuse getPr with page and per_page query params
        pageResults = await fetch<DiffEntry[]>(
          `/repos/${options.owner}/${options.repo}/pulls/${options.pr}/files?page=${page}&per_page=${perPage}`,
        );
        results.push(...pageResults);
        page++;
      } while (pageResults.length === perPage);

      return results;
    },

    /**
     * Get info about the comparison between two commits.
     */
    async compareCommits(options: {
      owner: string;
      repo: string;
      base: string;
      head: string;
    }): Promise<Comparison> {
      return await fetch<Comparison>(
        `/repos/${options.owner}/${options.repo}/compare/${options.base}...${options.head}`,
      );
    },
  };
}

export type GithubApi = ReturnType<typeof createGithubApi>;
