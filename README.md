![Github: Better Line Counts](./.github/assets/screenshot.png)

[<img height="72" src="./.github/assets/promo-cws.svg" alt="Available in the Chrome Web Store">](https://chrome.google.com/webstore/detail/ocfdgncpifmegplaglcnglhioflaimkd) [<img height="72" src="./.github/assets/promo-fas.svg" alt="Available in the Firefox Addon Store">](https://addons.mozilla.org/en-US/firefox/addon/github-better-line-counts/)

A chrome extension that removes generated files from GitHub's line counts, and shows a breakdown of the remaining lines by category (tests, docs, configs, ...) when hovering over the counts.

### How does this work?

The extension uses the Github API to load information about your PR then recalculates the diff, subtracting generated files listed in the repo's `.gitattributes` file.

```
pnpm-lock.yaml  linguist-generated
vendor/**/*     linguist-generated
*.gen.html      linguist-generated
```

You can also list glob patterns in the extension's options to mark files as generated across all repos.

The breakdown shown on hover is driven by a second, ordered list of categories in the options. Each category has a name, an icon, a color, and its own glob patterns. Files are matched top to bottom and the first match wins. The breakdown never changes the line counts; it only describes what the lines are made of. Files matching no category are listed as "Other", and generated files are listed last.

## Roadmap

- [x] `v1.0.0` Subtract a hardcoded list of generated files from PR diffs as POC
- [x] `v1.1.0` Support private repos via GitHub PAT
- [x] `v1.2.0` Make the list based off your `.gitattributes`
- [x] `v1.3.0` Show the number of generated lines next to additions and subtractions
- [x] `v1.9.0` Show a breakdown of the non-generated lines by category when hovering over the counts
- [ ] Recalculate the 5 diff boxes next to the count
- [ ] Add a dropdown that lists the files that were counted in the generated line count

That's it. Very simple, targeted extension for fixing 1 problem with GitHub.

## Development

You must use [Bun](https://bun.sh/) with this repo.

Install dependencies:

```sh
bun i
```

### Default GitHub Token

You can provide a default API token for development by creating a `.env.development.local` file:

```sh
VITE_DEFAULT_TOKEN=<your-token>
```

### Firefox Add-on ID

Firefox only installs an add-on permanently when its manifest declares an id, so self-distributed test builds need one. Set it when zipping for Firefox and leave it unset for store builds:

```sh
WXT_FIREFOX_ADDON_ID=<your-id> bun run zip:firefox
```

### Scripts

This extension is bundled via [WXT](https://wxt.dev).

- `bun dev`: Launches Chrome with the dev version of the extension installed.
- `bun run build`: Builds the extension for production. Outputs to the `dist` directory.
- `bun run zip`: Zips up the `dist` directory into an installable ZIP file.

Add `:firefox` suffix to some commands to target firefox instead of Chrome.

- `bun run build:firefox`
- `bun run dev:firefox`

### Running Tests

Unit tests are written with Vitest.

```ts
bun run test
```

## Release an Update

Use the [Submit for Review](https://github.com/aklinker1/github-better-line-counts/actions/workflows/submit.yml) workflow.
