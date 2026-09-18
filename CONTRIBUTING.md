# Contributing

This document describes how work flows through this repository: branches, commits, verification, artifact builds, and test releases. It applies to humans and coding agents alike; agents also read [`CLAUDE.md`](./CLAUDE.md) for session-level notes.

## Repository layout and remotes

- This is Jacky's fork of [aklinker1/github-better-line-counts](https://github.com/aklinker1/github-better-line-counts). `origin` is `git@github.com:Kit-p/github-better-line-counts.git`.
- Upstream is not configured as a remote by default. To sync `main`, add it once with `git remote add upstream https://github.com/aklinker1/github-better-line-counts.git` and fast-forward `main` from `upstream/main`.
- `main` mirrors upstream and never receives direct commits. All work happens on feature branches.
- Upstream's `main` is currently a work-in-progress WXT pre-release upgrade. It leaves 21 strict-null type errors in `src/utils/gitattributes/parseAst.ts`, so `bun check` is red on `main` independent of any feature work. Those errors are upstream's to fix; do not touch them inside unrelated changes.

## Branches

- Name branches `<type>/<kebab-topic>`, where `<type>` is one of the commit types below: `feat/breakdown-categories`, `fix/compare-head-only`, `chore/vitest-4`.
- One branch per deliverable. Follow-up fixes discovered while testing a feature land on the same feature branch as separate commits; they do not need their own branch.
- Test releases are cut from a feature branch head, never from `main`.
- The fork's default branch on GitHub is set to the active feature branch so that release and compare links default to it. Change it when the active branch changes.
- History on a pushed branch is rewritten only when the maintainer explicitly asks for it, and then with `git push --force-with-lease`. Unpushed history may be reorganized freely.

## Commits

Commits follow the Conventional Commits style that upstream's changelog generator consumes.

- Subject: `<type>: <Imperative sentence>` with a capital letter after the colon and no trailing period, ideally under 72 characters. Examples from this branch:
  - `feat: Show a breakdown of lines by category when hovering the counts`
  - `fix: Send no Authorization header when no token is set`
  - `chore: Run tests with vitest 4 and Vite 7`
  - `docs: Describe the breakdown, pattern syntax, Linguist mapping, and tools`
- Types: `feat`, `fix`, `chore`, `docs`, `ci`, `test`, `refactor`.
- Breaking changes: mark the subject with `!` (`feat!: Match patterns with .gitignore semantics`) and add a `BREAKING CHANGE:` footer that tells users what to adjust.
- Body: prose wrapped at about 76 columns. State the user-visible behavior and the cause, not the diff. Bullet lists are fine for several independent points.
- Trailer for agent-authored commits: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- One logical change per commit, with its tests in the same commit. Each commit must build and pass the test suite on its own. When a stage touches shared files such as `src/locales/en.yml` or `src/components/OptionsForm.vue`, stage explicit paths so unrelated edits do not ride along.
- Prefer committing after each verified stage over splitting a large diff afterwards. If a split is unavoidable, use `git reset --soft` and temporary file versions, then confirm each commit's subject before continuing.
- The pre-commit hook runs Prettier on staged files through lint-staged. Do not bypass it.

### Definition of done for a commit

Run all three and read the output; do not infer success from exit codes alone.

```sh
bunx wxt prepare && bun check     # only the 21 pre-existing parseAst errors may remain
bun run test -- --run             # all tests pass
bun run build                     # production build succeeds
```

`bunx wxt prepare` matters after the dev server has been running: `wxt dev` writes an incomplete `.wxt/types/imports.d.ts` that makes `bun check` report `i18n` template errors which are not real.

## Development environment

- Bun is pinned in `.tool-versions`; install dependencies with `bun install --frozen-lockfile`.
- `bun dev` launches Chrome with the extension loaded from `.output/chrome-mv3-dev`; `bun dev:firefox` does the same for Firefox. The dev server exits immediately without a TTY, so run it inside `tmux` when driving it from a script.
- Chrome derives a stable id for an unpacked extension from its path. For this checkout the options page is `chrome-extension://oehjifdpahhjpacchkgmjebdhndodlng/options.html`.
- Unit tests use Vitest with the WXT plugin; DOM tests declare `// @vitest-environment jsdom`. `src/utils/__tests__/breakdown.test.ts` holds the corpus of representative paths that pins the default categories; extend it whenever a default pattern changes.

## Artifact builds

Production builds and zips come from the existing scripts and land in `.output/`:

```sh
bun run build          # Chrome, .output/chrome-mv3
bun run zip            # Chrome zip
bun run zip:firefox    # Firefox build and zip (plus a sources zip, not published)
```

### Versioning test builds

`package.json` keeps upstream's version. Test artifacts carry a pre-release version that is set only for the duration of the build and never committed:

```sh
cp package.json /tmp/package.json.bak
bun -e 'const p = await Bun.file("package.json").json(); p.version = "2.0.0-beta.4"; await Bun.write("package.json", JSON.stringify(p, null, 2) + "\n")'
rm -f .output/*.zip .output/*.xpi
bun run zip
WXT_FIREFOX_ADDON_ID=github-better-line-counts-beta@kit-p.github.io bun run zip:firefox
cp /tmp/package.json.bak package.json
cp .output/github-better-line-counts-2.0.0-beta.4-firefox.zip .output/github-better-line-counts-2.0.0-beta.4-firefox.xpi
```

- WXT writes the numeric part to the manifest `version` and, for Chrome, the full string to `version_name`. Check both manifests in `.output/` before publishing.
- Firefox installs an add-on permanently only when it declares an id, so Firefox test builds set `WXT_FIREFOX_ADDON_ID`. Store builds leave it unset. The id above is tied to this fork's test line; do not reuse it for anything else.
- Rename the Firefox zip to `.xpi` for the release asset; the contents are identical.
- Unsigned Firefox builds load through `about:debugging` in any Firefox, and install permanently only on Developer Edition, Nightly, or ESR with `xpinstall.signatures.required` set to false. Regular Firefox needs a Mozilla-signed build, which requires the maintainer's AMO API credentials and `web-ext sign --channel unlisted`.

## Releases

Test releases are GitHub pre-releases on the fork. Store releases are upstream's business and run through upstream's Submit for Review workflow; the fork never publishes to the stores.

### Version and tag convention

- Tags are `v<semver>`, pre-release identifiers are `-beta.N`, so `v2.0.0-beta.4`.
- Bump the major when a user-visible contract breaks, such as the pattern semantics change in 2.0. Bump the pre-release number for every published test build.
- Each published fix that changes user-visible behavior gets a new beta rather than a replaced asset. Older betas stay. A release is deleted and recreated only when the maintainer explicitly asks; then use `gh release delete vX.Y.Z-beta.N --cleanup-tag --yes` and recreate at the new head.
- The tag must point at the commit the assets were built from. Verify with `git rev-parse vX.Y.Z-beta.N` against `git rev-parse origin/<branch>` after publishing.

### Procedure

1. Finish and push the commit series. The working tree must be clean.
2. Build both artifacts as described above.
3. Write the notes to a file and publish:

```sh
gh release create v2.0.0-beta.4 \
  --repo Kit-p/github-better-line-counts \
  --target feat/breakdown-categories \
  --prerelease \
  --title "v2.0.0-beta.4: <feature summary> (test build)" \
  --notes-file /tmp/release-notes.md \
  .output/github-better-line-counts-2.0.0-beta.4-chrome.zip \
  .output/github-better-line-counts-2.0.0-beta.4-firefox.xpi
```

4. Confirm with `gh release view vX --json url,tagName,targetCommitish,assets` and the tag check above.

### Release notes template

Reuse the previous beta's notes as the base (`gh release view <prev> --json body --jq .body`) and keep these sections in this order:

1. One-line summary: test build, which release it supersedes, install manually, disable the store version while testing.
2. `## Breaking change` when applicable, with what users must adjust.
3. `## Changes since <previous beta>` as a bullet list.
4. `## New in <major>` for the feature summary carried across betas.
5. `## Fixes included`.
6. `## Coming from an earlier beta`: saved settings do not update themselves; Restore Defaults in both the Generated Files and the Breakdown sections, then Save Changes.
7. `## Install` with the Chrome steps and the three Firefox cases (temporary in any Firefox; permanent on Developer Edition, Nightly, ESR; regular Firefox refuses unsigned builds).
8. `## What to test` and the issues link.
9. A final line: built from `<short sha>` on `<branch>`, the version was set for the build only, and the Firefox add-on id.

## Working with the maintainer

- Feature work starts with a design discussion. Propose options with a recommendation and a short numbered list of decisions; implement only on an explicit go.
- Report outcomes with the verification results, the commits pushed, the release URL when one was published, and anything left unverified, such as UI that could only be checked by hand.
- The maintainer tests artifacts by hand and reports back in rounds; each round's fixes become commits on the same branch and, when user-visible, a new beta.
