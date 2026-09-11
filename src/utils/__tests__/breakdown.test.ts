import { describe, expect, it } from "vitest";
import {
  CATEGORY_COLORS,
  DEFAULT_BREAKDOWN_CATEGORIES,
  PRESET_CATEGORIES,
  createBreakdownCategory,
} from "../breakdown";
import { DEFAULT_CUSTOM_LIST_ALL } from "../constants";
import { DEFAULT_LINGUIST_MAPPINGS } from "../linguist";
import { classifyFile, type Classifier } from "../classify";
import { parsePatterns } from "../patterns";

const defaults: Classifier = {
  generated: parsePatterns(DEFAULT_CUSTOM_LIST_ALL),
  categories: DEFAULT_BREAKDOWN_CATEGORIES.map((category) => ({
    id: category.id,
    patterns: parsePatterns(category.patterns),
  })),
  linguist: DEFAULT_LINGUIST_MAPPINGS,
};

function classify(file: string): string {
  const result = classifyFile(file, defaults);
  return result.kind === "category" ? result.categoryId : result.kind;
}

describe("default categories", () => {
  it("should have unique ids, icons, and palette colors", () => {
    const all = [...DEFAULT_BREAKDOWN_CATEGORIES, ...PRESET_CATEGORIES];
    const ids = all.map((category) => category.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const category of all) {
      expect(category.icon).not.toBe("");
      expect(category.name).not.toBe("");
      expect(CATEGORY_COLORS).toContain(category.color);
    }
  });

  it("should use distinct colors for the defaults", () => {
    const colors = DEFAULT_BREAKDOWN_CATEGORIES.map((c) => c.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("should only contain patterns that parse and none that negate", () => {
    const lists = [
      DEFAULT_CUSTOM_LIST_ALL,
      ...[...DEFAULT_BREAKDOWN_CATEGORIES, ...PRESET_CATEGORIES].map(
        (c) => c.patterns,
      ),
    ];
    for (const list of lists) {
      const lines = list
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "" && !l.startsWith("#"));
      const parsed = parsePatterns(list);
      expect(parsed).toHaveLength(lines.length);
      expect(parsed.every((p) => !p.negated)).toBe(true);
    }
  });

  it.each([
    // Agents, before CI/CD and Docs
    ["CLAUDE.md", "agents"],
    ["packages/api/AGENTS.md", "agents"],
    [".claude/settings.json", "agents"],
    [".cursor/rules/app.mdc", "agents"],
    [".github/copilot-instructions.md", "agents"],
    [".github/instructions/api.instructions.md", "agents"],
    [".planning/ROADMAP.md", "agents"],
    ["llms.txt", "agents"],
    // Tests across ecosystems
    ["src/__tests__/a.ts", "tests"],
    ["src/Button.test.tsx", "tests"],
    ["tests/unit/x.py", "tests"],
    ["pkg/conftest.py", "tests"],
    ["module/src/test/java/FooTest.java", "tests"],
    ["Tests/AppTests/FooTests.swift", "tests"],
    ["internal/foo_test.go", "tests"],
    ["testdata/x.json", "tests"],
    ["spec/models/user_spec.rb", "tests"],
    ["app/Http/FooTest.php", "tests"],
    ["MyProject.Tests/UnitTest1.cs", "tests"],
    ["features/login.feature", "tests"],
    ["src/Button.stories.tsx", "tests"],
    ["tests/fixtures/data.sql", "tests"],
    // CI/CD
    [".github/workflows/ci.yml", "ci"],
    [".github/dependabot.yml", "ci"],
    [".github/CODEOWNERS", "ci"],
    [".gitlab-ci.yml", "ci"],
    ["Jenkinsfile", "ci"],
    [".circleci/config.yml", "ci"],
    ["renovate.json", "ci"],
    // Infrastructure
    ["Dockerfile", "infrastructure"],
    ["apps/web/Dockerfile.dev", "infrastructure"],
    ["docker-compose.override.yml", "infrastructure"],
    [".devcontainer/devcontainer.json", "infrastructure"],
    ["infra/main.tf", "infrastructure"],
    ["k8s/deployment.yaml", "infrastructure"],
    ["charts/app/values.yaml", "infrastructure"],
    ["Vagrantfile", "infrastructure"],
    ["fly.toml", "infrastructure"],
    ["cdk.json", "infrastructure"],
    // Database
    ["db/migrate/20240101_create_users.rb", "database"],
    ["db/schema.rb", "database"],
    ["app/migrations/0001_initial.py", "database"],
    ["src/Migrations/20240101_Init.cs", "database"],
    ["prisma/schema.prisma", "database"],
    ["database/seeders/UserSeeder.php", "database"],
    ["supabase/migrations/001.sql", "database"],
    ["sql/views.sql", "database"],
    // i18n
    ["locales/en.json", "i18n"],
    ["app/src/main/res/values-de/strings.xml", "i18n"],
    ["Resources/Strings.resx", "i18n"],
    ["i18n/messages_fr.properties", "i18n"],
    ["po/de.po", "i18n"],
    // Dependencies
    ["package.json", "dependencies"],
    ["packages/ui/package.json", "dependencies"],
    ["go.mod", "dependencies"],
    ["Cargo.toml", "dependencies"],
    ["pom.xml", "dependencies"],
    ["Gemfile", "dependencies"],
    ["composer.json", "dependencies"],
    ["pyproject.toml", "dependencies"],
    ["requirements/dev.txt", "dependencies"],
    ["src/App/App.csproj", "dependencies"],
    ["pubspec.yaml", "dependencies"],
    ["gradle/libs.versions.toml", "dependencies"],
    // Configs
    [".eslintrc.json", "configs"],
    ["eslint.config.js", "configs"],
    ["tsconfig.build.json", "configs"],
    ["Makefile", "configs"],
    ["CMakeLists.txt", "configs"],
    [".vscode/settings.json", "configs"],
    [".pre-commit-config.yaml", "configs"],
    ["ruff.toml", "configs"],
    [".editorconfig", "configs"],
    ["phpunit.xml.dist", "configs"],
    ["mise.toml", "configs"],
    // Docs
    ["README.md", "docs"],
    ["docs/guide.md", "docs"],
    ["LICENSE", "docs"],
    ["CHANGELOG.md", "docs"],
    ["examples/basic/main.go", "docs"],
    [".github/ISSUE_TEMPLATE/bug.yml", "docs"],
    // Generated
    ["bun.lock", "generated"],
    ["pnpm-lock.yaml", "generated"],
    ["go.sum", "generated"],
    ["Package.resolved", "generated"],
    ["gen/api.pb.go", "generated"],
    ["vendor/lib/x.go", "generated"],
    ["dist/index.js", "generated"],
    ["node_modules/x/index.js", "generated"],
    ["foo.min.js", "generated"],
    ["app.js.map", "generated"],
    ["src/__generated__/graphql.ts", "generated"],
    ["gradlew", "generated"],
    // Application code stays in other, including framework config directories
    ["src/index.ts", "other"],
    ["app/models/user.rb", "other"],
    ["config/routes.rb", "other"],
    ["src/main/java/App.java", "other"],
    ["lib/app.dart", "other"],
    ["application.yml", "other"],
    ["spin-lock.ts", "other"],
  ])("should classify %s as %s", (file, expected) => {
    expect(classify(file)).toBe(expected);
  });
});

describe("createBreakdownCategory", () => {
  it("should pick the first palette color not in use", () => {
    const used = CATEGORY_COLORS.slice(0, 3);
    expect(createBreakdownCategory(used).color).toBe(CATEGORY_COLORS[3]);
  });

  it("should fall back to the least-used color when all are taken", () => {
    const used = [...CATEGORY_COLORS, CATEGORY_COLORS[0]!, CATEGORY_COLORS[1]!];
    expect(createBreakdownCategory(used).color).toBe(CATEGORY_COLORS[2]);
  });

  it("should create unique ids", () => {
    expect(createBreakdownCategory().id).not.toBe(createBreakdownCategory().id);
  });
});
