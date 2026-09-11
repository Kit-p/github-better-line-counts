/**
 * Default patterns marking files as generated. These files are subtracted from the line counts,
 * so the list is deliberately conservative: lockfiles, unmistakable generated-code suffixes, and
 * vendored directories that GitHub's own Linguist treats as vendored.
 */
export const DEFAULT_CUSTOM_LIST_ALL = `# Lockfiles
*.lock
*.lock.*
*.lockb
pnpm-lock.yaml
package-lock.json
shrinkwrap.yaml
*.lockfile
*.resolved
go.sum
npm-shrinkwrap.json
# Generated code
*.generated.*
*_generated.*
*.gen.*
*.g.dart
*.freezed.dart
*.pb.go
*.pb.cc
*.pb.h
*.pb.swift
*_pb2.py
*_pb2_grpc.py
*.Designer.cs
*.min.js
*.min.css
*.js.map
*.css.map
__generated__/
generated/
# Vendored code and build output
vendor/
node_modules/
bower_components/
third_party/
Pods/
**/.yarn/releases/
**/.yarn/plugins/
**/.yarn/sdks/
.pnp.cjs
.pnp.loader.mjs
gradlew
gradlew.bat
mvnw
mvnw.cmd
dist/`;

export const GREY_COLOR = "var(--color-fg-muted, var(--fgColor-muted))";
export const DIFF_COMPONENT_ID = "github-better-line-counts";
export const BREAKDOWN_CARD_ID = "github-better-line-counts-breakdown";
