/**
 * A user-defined group of files shown in the breakdown when hovering over the line counts.
 *
 * Categories never change the line counts themselves; they only describe what the lines are made
 * of.
 */
export interface BreakdownCategory {
  /**
   * Stable identifier. Built-in categories use fixed ids, user-created ones use a random UUID.
   */
  id: string;
  name: string;
  /**
   * An emoji or short symbol shown in front of the name.
   */
  icon: string;
  /**
   * Hex color used for the category's segment of the proportion bar. Normally one of
   * `CATEGORY_COLORS`.
   */
  color: string;
  /**
   * Newline-separated glob patterns. See `parsePatterns`.
   */
  patterns: string;
}

const BLUE = "#0969da";
const TEAL = "#1b7c83";
const GREEN = "#1a7f37";
const YELLOW = "#bf8700";
const ORANGE = "#bc4c00";
const RED = "#cf222e";
const PINK = "#bf3989";
const PURPLE = "#8250df";
const BROWN = "#a06432";

/**
 * Hand-picked colors offered for categories. Each keeps at least 3:1 contrast against the hover
 * card's background in GitHub's light, dark, and high-contrast themes, so bar segments and swatches
 * stay visible everywhere.
 */
export const CATEGORY_COLORS: readonly string[] = [
  BLUE,
  TEAL,
  GREEN,
  YELLOW,
  ORANGE,
  RED,
  PINK,
  PURPLE,
  BROWN,
];

/**
 * Color used for files that don't match any category.
 */
export const OTHER_CATEGORY_COLOR = "#8c959f";

/**
 * Color and icon used for the generated files row at the end of the breakdown. The icon matches
 * the ⌁ count shown next to the additions and deletions.
 */
export const GENERATED_CATEGORY_COLOR = "#606a75";
export const GENERATED_CATEGORY_ICON = "⌁";

/**
 * Icons offered as quick picks in the options page.
 */
export const SUGGESTED_CATEGORY_ICONS = [
  "🧪",
  "🔁",
  "🏗️",
  "⚙️",
  "📄",
  "🎨",
  "🧩",
  "🗃️",
  "🔒",
  "📦",
  "🌐",
  "📁",
];

/**
 * Categories seeded on install. Order matters: files are matched top to bottom and the first match
 * wins, so the broadest patterns come last.
 */
export const DEFAULT_BREAKDOWN_CATEGORIES: BreakdownCategory[] = [
  {
    id: "tests",
    name: "Tests",
    icon: "🧪",
    color: PURPLE,
    patterns: `*.test.*
*.spec.*
*_test.go
test_*.py
*_test.py
conftest.py
*.snap
__tests__/
__snapshots__/
__mocks__/
test/
tests/
e2e/
cypress/`,
  },
  {
    id: "ci",
    name: "CI/CD",
    icon: "🔁",
    color: BLUE,
    patterns: `.github/workflows/*.yml
.github/workflows/*.yaml
.github/actions/
.github/dependabot.yml
.gitlab-ci.yml
.circleci/
.buildkite/
.travis.yml
.drone.yml
appveyor.yml
azure-pipelines.yml
bitbucket-pipelines.yml
Jenkinsfile`,
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    icon: "🏗️",
    color: ORANGE,
    patterns: `Dockerfile
Dockerfile.*
*.dockerfile
.dockerignore
docker-compose*.yml
docker-compose*.yaml
compose.yml
compose.yaml
*.tf
*.tfvars
.terraform.lock.hcl
serverless.yml
serverless.yaml
Chart.yaml
*.bicep
Pulumi*.yaml
cdk.json
Vagrantfile
Procfile
fly.toml
vercel.json
netlify.toml`,
  },
  {
    id: "configs",
    name: "Configs",
    icon: "⚙️",
    color: YELLOW,
    patterns: `*.config.*
.*rc
.*rc.*
.editorconfig
.gitignore
.gitattributes
.gitkeep
.gitmodules
.tool-versions
.env
.env.*
.prettierignore
.eslintignore
.npmignore
renovate.json
.vscode/
.idea/
.husky/`,
  },
  {
    id: "docs",
    name: "Docs",
    icon: "📄",
    color: PINK,
    patterns: `*.md
*.mdx
*.rst
*.adoc
docs/
doc/
LICENSE*
LICENCE*
CHANGELOG*
AUTHORS*
CONTRIBUTORS*
NOTICE*`,
  },
];

/**
 * Create an empty category with a fresh id, ready to be edited in the options page. Picks the first
 * palette color not already used by `usedColors` so new categories stay distinguishable.
 */
export function createBreakdownCategory(
  usedColors: readonly string[] = [],
): BreakdownCategory {
  return {
    id: crypto.randomUUID(),
    name: "",
    icon: "📁",
    color: CATEGORY_COLORS.find((color) => !usedColors.includes(color)) ?? BLUE,
    patterns: "",
  };
}
