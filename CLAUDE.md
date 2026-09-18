# CLAUDE.md

Guidance for Claude Code sessions in this repository. The conventions for branches, commits, builds, and releases live in [`CONTRIBUTING.md`](./CONTRIBUTING.md); follow them exactly. This file adds what only matters when an agent is driving.

## How the maintainer works

- A message starting with "Discuss with me", or one that reads as thinking aloud, wants an assessment: options, a recommendation, and a short numbered list of decisions. Do not write code until there is an explicit go.
- Bug reports arrive as screenshots plus a sentence. Diagnose against real data first (the GitHub API, a rendered page, a unit test that reproduces the failure), then fix. Say what could not be verified.
- Feedback comes in rounds. Each round: fix, run the verification trio, commit per logical change, push, and when the change is user-visible publish a new beta. Report with a small verification table and the commit list.

## Verification before any commit

```sh
bunx wxt prepare && bun check     # exactly the 21 pre-existing parseAst errors remain; anything else is yours
bun run test -- --run
bun run build
```

Read the output. Do not treat `bun check` exiting non-zero as failure by itself; compare the file list against the known parseAst errors.

## Environment gotchas on this machine

- The shell is zsh with `noclobber`: overwrite existing files with `>|`. Heredocs into new files are fine with `>`.
- `nomatch` is on: an unmatched glob such as `.output/*.xpi` aborts an `&&` chain. Run `setopt +o nomatch` first or avoid globs that may be empty.
- A heredoc's terminator line ends an `&&` chain. Write commit messages and release notes to files as standalone statements, then run the chain.
- `set -e` did not stop a chained script after failures here. Chain steps with `&&` and check each commit's subject with `git log --format=%s -1` before continuing.
- `diff` is aliased to `delta`; use `/usr/bin/diff` for machine-readable output.
- `bun dev` exits without a TTY. Start it in a detached tmux session, for example `tmux new-session -d -s wxt-dev -c "$PWD" 'bun dev 2>&1 | tee -a /tmp/wxt-dev.log'`, and kill the session when done.
- Bun's `Bun.$` shell treats `&` in an interpolated URL as a background operator; pass URLs as variables.

## Product constraints worth remembering

- GitHub's compare API returns at most 300 files with no way to page them, and its per-file stats are unreliable on large comparisons. Pull request and commit endpoints paginate up to 3,000 files. The raw `.diff` download has no file cap but is served from `patch-diff.githubusercontent.com` for pull requests without CORS headers, so it can only be fetched from the background with host permissions. See the research notes in the branch discussion before changing the data source.
- GitHub's UI shows at most 300 files and 20,000 lines per diff view and lazy-loads the rest, so per-file counts cannot be scraped from the DOM for large diffs.
- Injected page UI stays `position: absolute` in document coordinates. Firefox renders color emoji inside `position: fixed` layers at their unzoomed size under trackpad pinch zoom.
- Firefox suppresses `alert`, `confirm`, and `prompt` in embedded options pages; use an in-page `<dialog>`.
- Saved user settings never pick up new defaults on their own; both the generated list and the categories have Restore Defaults buttons for that reason. Mention it in release notes whenever defaults change.
- Patterns follow `.gitignore` semantics with case-insensitive matching. The corpus test in `src/utils/__tests__/breakdown.test.ts` must be updated alongside any default pattern change.
