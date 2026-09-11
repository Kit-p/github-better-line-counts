/**
 * A user-defined group of files shown in the breakdown when hovering over the line counts.
 *
 * Categories never change the line counts themselves; they only describe what the lines are made
 * of.
 */
export interface BreakdownCategory {
  /**
   * Stable identifier. Built-in categories and presets use fixed ids, user-created ones a UUID.
   */
  id: string;
  name: string;
  /**
   * An emoji or short symbol shown in front of the name.
   */
  icon: string;
  /**
   * Hex color used for the category's segment of the proportion bar. Normally one of
   * `CATEGORY_COLORS`, but any color the user picked is kept.
   */
  color: string;
  /**
   * Newline-separated `.gitignore`-style patterns. See `parsePatterns`.
   */
  patterns: string;
}

const BLUE = "#0969da";
const SKY = "#0598bc";
const TEAL = "#1b7c83";
const GREEN = "#1a7f37";
const LIME = "#5f8f00";
const YELLOW = "#bf8700";
const ORANGE = "#bc4c00";
const RED = "#cf222e";
const PINK = "#bf3989";
const PURPLE = "#8250df";
const INDIGO = "#6366f1";
const BROWN = "#a06432";

/**
 * Hand-picked colors offered for categories. Each keeps at least 3:1 contrast against the hover
 * card's background in GitHub's light, dark, and high-contrast themes, so bar segments and swatches
 * stay visible everywhere.
 */
export const CATEGORY_COLORS: readonly string[] = [
  BLUE,
  SKY,
  TEAL,
  GREEN,
  LIME,
  YELLOW,
  ORANGE,
  RED,
  PINK,
  PURPLE,
  INDIGO,
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
  "🤖",
  "🧪",
  "🔁",
  "🏗️",
  "🗃️",
  "🌐",
  "📦",
  "⚙️",
  "📄",
  "🎨",
  "🖼️",
  "📓",
  "🧩",
  "⏱️",
  "🔧",
  "🔒",
  "📁",
];

/**
 * Categories seeded on install. Order matters: files are matched top to bottom and the first match
 * wins. Agents come first so that `CLAUDE.md` beats `*.md` and Copilot's files beat `.github/`;
 * Docs come last because `*.md` is the widest net. Patterns follow `.gitignore` rules, so a
 * pattern containing a slash is anchored to the repository root unless it starts with `**\/`.
 */
export const DEFAULT_BREAKDOWN_CATEGORIES: BreakdownCategory[] = [
  {
    id: "agents",
    name: "Agents",
    icon: "🤖",
    color: INDIGO,
    patterns: `# Instruction files read by coding agents
AGENTS.md
AGENT.md
CLAUDE.md
CLAUDE.local.md
GEMINI.md
llms.txt
llms-full.txt
# Tool directories: Claude Code, Codex, Cursor, Windsurf, Cline, Roo, Gemini, Aider, Continue,
# Junie, Kiro, Amazon Q, OpenCode, Factory, Augment, Goose, Trae, Zed
.claude/
.codex/
.cursor/
.cursorrules
.cursorignore
.cursorindexingignore
.windsurf/
.windsurfrules
.clinerules
.clinerules/
.roo/
.roomodes
.roorules*
.gemini/
.aider*
.continue/
.continuerules
.junie/
.kiro/
.amazonq/
.opencode/
opencode.json
.agents/
.agent/
.factory/
.augment/
.augment-guidelines
.goosehints
.trae/
.rules
.mcp.json
mcp.json
# GitHub Copilot
.github/copilot-instructions.md
.github/instructions/
.github/prompts/
.github/agents/
.github/chatmodes/
.github/skills/
# Specs and plans
.specify/
.planning/
.plans/
.taskmaster/
.ai/`,
  },
  {
    id: "tests",
    name: "Tests",
    icon: "🧪",
    color: PURPLE,
    patterns: `# Directories
__tests__/
__mocks__/
__snapshots__/
__fixtures__/
test/
tests/
spec/
testing/
testdata/
fixtures/
e2e/
cypress/
playwright/
**/src/test/
**/src/androidTest/
**/src/integrationTest/
*Tests/
# Files
*.test.*
*.spec.*
*.stories.*
*.snap
*.feature
*_test.go
*_test.py
test_*.py
conftest.py
*_test.rb
*_spec.rb
*Test.java
*Tests.java
*IT.java
*Test.kt
*Tests.kt
*Spec.groovy
*Test.scala
*Spec.scala
*Test.php
*Test.cs
*Tests.cs
*_test.cc
*_test.cpp
*_unittest.cc
*_test.dart
*_test.exs
*Tests.swift`,
  },
  {
    id: "ci",
    name: "CI/CD",
    icon: "🔁",
    color: BLUE,
    patterns: `# GitHub: workflows, actions, and the config files at the top of .github
.github/workflows/
.github/actions/
.github/*.yml
.github/*.yaml
.github/CODEOWNERS
CODEOWNERS
# Other CI systems
.gitlab/
.gitlab-ci.yml
Jenkinsfile
Jenkinsfile.*
.circleci/
.travis.yml
appveyor.yml
.appveyor.yml
azure-pipelines*.yml
azure-pipelines*.yaml
.azure-pipelines/
bitbucket-pipelines.yml
.buildkite/
.drone.yml
.woodpecker.yml
.woodpecker/
cloudbuild.yaml
cloudbuild.yml
buildspec.yml
buildspec.yaml
.teamcity/
.semaphore/
.tekton/
codemagic.yaml
# Release and dependency automation
.goreleaser.yml
.goreleaser.yaml
.releaserc*
release-please-config.json
.release-please-manifest.json
renovate.json
renovate.json5
.renovaterc*
.mergify.yml
.mergify/
codecov.yml
.codecov.yml
sonar-project.properties`,
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    icon: "🏗️",
    color: ORANGE,
    patterns: `# Containers
Dockerfile
Dockerfile.*
*.Dockerfile
*.dockerfile
.dockerignore
docker-compose*.yml
docker-compose*.yaml
compose.yml
compose.yaml
compose.*.yml
compose.*.yaml
docker/
.docker/
.devcontainer/
devcontainer.json
# Infrastructure as code
*.tf
*.tfvars
*.tf.json
*.tfvars.json
terragrunt.hcl
Pulumi.yaml
Pulumi.*.yaml
cdk.json
cdk.context.json
samconfig.toml
serverless.yml
serverless.yaml
serverless.ts
serverless.js
*.bicep
cloudformation/
*.pkr.hcl
Vagrantfile
*.nix
ansible/
playbooks/
# Kubernetes
Chart.yaml
charts/
helm/
kustomization.yaml
kustomization.yml
k8s/
kubernetes/
manifests/
deploy/
deployments/
# Platforms and servers
Procfile
Procfile.*
fly.toml
vercel.json
netlify.toml
render.yaml
railway.json
railway.toml
heroku.yml
.ebextensions/
nginx.conf
nginx/
Caddyfile
Tiltfile
skaffold.yaml
Earthfile`,
  },
  {
    id: "database",
    name: "Database",
    icon: "🗃️",
    color: BROWN,
    patterns: `migrations/
migration/
**/db/migrate/
**/db/schema.rb
**/db/structure.sql
**/db/seeds.rb
**/db/seeds/
**/db/changelog/
**/supabase/migrations/
alembic/
prisma/
drizzle/
database/
seeds/
seeders/
liquibase/
*.sql
*.dbml`,
  },
  {
    id: "i18n",
    name: "i18n",
    icon: "🌐",
    color: TEAL,
    patterns: `locales/
locale/
i18n/
lang/
translations/
translation/
intl/
l10n/
LC_MESSAGES/
**/values-*/strings.xml
messages*.properties
*.po
*.pot
*.mo
*.xlf
*.xliff
*.resx
*.strings
*.stringsdict
*.xcstrings
*.arb
*.ftl`,
  },
  {
    id: "dependencies",
    name: "Dependencies",
    icon: "📦",
    color: GREEN,
    patterns: `# Manifests only; lockfiles are in the generated list
package.json
requirements*.txt
requirements/
Pipfile
pyproject.toml
setup.py
setup.cfg
environment.yml
Gemfile
*.gemspec
composer.json
pom.xml
build.gradle
build.gradle.kts
settings.gradle
settings.gradle.kts
libs.versions.toml
*.csproj
*.fsproj
*.vbproj
Directory.*.props
packages.config
paket.dependencies
go.mod
go.work
Cargo.toml
Package.swift
Podfile
*.podspec
Cartfile
pubspec.yaml
mix.exs
rebar.config
Project.toml
DESCRIPTION
cpanfile
conanfile.txt
conanfile.py
vcpkg.json
stack.yaml
*.cabal
deno.json
deno.jsonc
elm.json
build.sbt
project.clj
deps.edn
shard.yml
dune-project
*.opam`,
  },
  {
    id: "configs",
    name: "Configs",
    icon: "⚙️",
    color: YELLOW,
    patterns: `# Tooling and repository configuration. Framework config directories such as Rails' config/
# stay out on purpose, since they hold application code.
*.config.*
.*rc
.*rc.*
.editorconfig
.gitignore
.gitattributes
.gitmodules
.gitkeep
.mailmap
# Toolchain versions
.tool-versions
.node-version
.python-version
.ruby-version
.java-version
.terraform-version
mise.toml
.mise.toml
.env
.env.*
# JavaScript and TypeScript
tsconfig*.json
jsconfig.json
biome.json
biome.jsonc
.prettierignore
.eslintignore
.npmignore
.gcloudignore
.vercelignore
pnpm-workspace.yaml
lerna.json
nx.json
turbo.json
.storybook/
# Hooks and editors
.pre-commit-config.yaml
lefthook.yml
.lefthook.yml
.husky/
.vscode/
.idea/
*.code-workspace
# Python
tox.ini
pytest.ini
pyrightconfig.json
mypy.ini
.flake8
ruff.toml
.ruff.toml
# Ruby and PHP
.rubocop.yml
.rspec
phpcs.xml*
.phpcs.xml
phpunit.xml*
phpstan.neon*
psalm.xml
.php-cs-fixer*
# JVM, Go, Rust, C, .NET, Swift, Dart
checkstyle.xml
gradle.properties
.golangci.*
rustfmt.toml
.rustfmt.toml
clippy.toml
.clang-format
.clang-tidy
.clangd
global.json
nuget.config
omnisharp.json
.swiftlint.yml
.swiftformat
analysis_options.yaml
# Linters for text formats
.markdownlint*
.yamllint*
.hadolint.yaml
# Build systems and task runners
Makefile
GNUmakefile
CMakeLists.txt
*.cmake
justfile
Taskfile.yml
Taskfile.yaml
Rakefile
gulpfile.*
Gruntfile.*
MODULE.bazel
WORKSPACE
WORKSPACE.bazel
BUILD
BUILD.bazel
*.bzl
# Dev environments and docs tooling
.gitpod.yml
.gitpod.Dockerfile
.replit
replit.nix
mkdocs.yml`,
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
*.asciidoc
docs/
doc/
documentation/
javadoc/
groovydoc/
man/
examples/
samples/
sample/
demos/
demo/
.github/ISSUE_TEMPLATE/
.github/PULL_REQUEST_TEMPLATE*
.github/DISCUSSION_TEMPLATE/
README*
LICENSE*
LICENCE*
COPYING*
CHANGELOG*
CHANGES*
HISTORY*
CONTRIBUTING*
CODE_OF_CONDUCT*
SECURITY*
SUPPORT*
GOVERNANCE*
MAINTAINERS*
AUTHORS*
CONTRIBUTORS*
NOTICE*
CITATION*
INSTALL*`,
  },
];

/**
 * Optional categories offered in the options page. They are not seeded, since not every repo has
 * them, but each is one click to add. Colors are reassigned on add to avoid clashes.
 */
export const PRESET_CATEGORIES: BreakdownCategory[] = [
  {
    id: "styles",
    name: "Styles",
    icon: "🎨",
    color: SKY,
    patterns: `*.css
*.scss
*.sass
*.less
*.styl
*.pcss`,
  },
  {
    id: "assets",
    name: "Assets",
    icon: "🖼️",
    color: LIME,
    patterns: `public/
static/
assets/
*.svg
*.png
*.jpg
*.jpeg
*.gif
*.webp
*.avif
*.ico
*.bmp
*.woff
*.woff2
*.ttf
*.otf
*.eot
*.mp3
*.mp4
*.webm
*.wav
*.pdf`,
  },
  {
    id: "notebooks",
    name: "Notebooks",
    icon: "📓",
    color: RED,
    patterns: `*.ipynb
*.Rmd
*.qmd`,
  },
  {
    id: "schemas",
    name: "Schemas",
    icon: "🧩",
    color: INDIGO,
    patterns: `*.proto
*.graphql
*.graphqls
*.gql
openapi*.yml
openapi*.yaml
openapi*.json
swagger*.yml
swagger*.yaml
swagger*.json
*.avsc
*.avdl
*.thrift
*.fbs
*.capnp
*.xsd
*.wsdl`,
  },
  {
    id: "benchmarks",
    name: "Benchmarks",
    icon: "⏱️",
    color: PURPLE,
    patterns: `bench/
benches/
benchmark/
benchmarks/
perf/
*_bench.go
*.bench.*
*Benchmark.java
*Benchmarks.cs
*_benchmark.py`,
  },
  {
    id: "scripts",
    name: "Scripts",
    icon: "🔧",
    color: BROWN,
    patterns: `scripts/
script/
bin/
tools/
*.sh
*.bash
*.zsh
*.ps1
*.bat
*.cmd`,
  },
];

/**
 * The first palette color not already used, or the least-used one once every color is taken.
 */
export function pickCategoryColor(usedColors: readonly string[]): string {
  const unused = CATEGORY_COLORS.find((color) => !usedColors.includes(color));
  if (unused) return unused;

  let best = BLUE;
  let bestCount = Infinity;
  for (const color of CATEGORY_COLORS) {
    const count = usedColors.filter((used) => used === color).length;
    if (count < bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Create an empty category with a fresh id, ready to be edited in the options page.
 */
export function createBreakdownCategory(
  usedColors: readonly string[] = [],
): BreakdownCategory {
  return {
    id: crypto.randomUUID(),
    name: "",
    icon: "📁",
    color: pickCategoryColor(usedColors),
    patterns: "",
  };
}
