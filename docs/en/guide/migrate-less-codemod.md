# less2cssinjs

`@antdv-next/less2cssinjs` is this project's independent Vue SFC Less migration package. Its `antdv-style-codemod` command migrates the safe Vue CSS Module Less subset to `createStyles`.

## Purpose and Optional Use

This is an optional code migration tool for developers using `antdv-style` in their applications, not an internal test tool for this repository. Run it when converting existing Vue Less CSS Modules to `createStyles`. New projects, manual migrations, and projects retaining their existing Less styles do not need it.

The tool runs on demand in a local Node.js environment. Installing the main package, starting an application, or building it does not automatically migrate files, and the tool is not involved in browser styling. Migrated code uses the core `antdv-style` APIs and does not need to import the codemod.

The package actually depends on `@chenshuai2144/less2cssinjs@1.0.7` and calls its token and common-mixin converters. Our adapter owns Vue SFC rewriting, CSS Modules and theme reactivity. It does not run upstream's React/TSX CLI or copy selector flattening that could change ancestor relationships.

The name keeps the upstream `less2cssinjs` and uses the `@antdv-next` scope to distinguish this project's Vue implementation.

## Package Layout and Installation

The tool lives in `packages/less2cssinjs` in the same repository, named `@antdv-next/less2cssinjs`. Import its APIs from that package. The executable remains `antdv-style-codemod`, now owned by the migration package. The runtime package stays at the repository root and no longer provides the tool subpath or CLI.

The tool owns its Vue, JavaScript and Less parsing dependencies; they are no longer tooling dependencies of the main package. Add this package as a development dependency only to projects that need migration.

The repository split is complete; this does not imply an npm release. Run `pnpm install` and `pnpm pack:packages` at the repository root, then install the resulting archive in the project to migrate:

```bash
pnpm add -D /path/to/antdv-style/artifacts/antdv-next-less2cssinjs-1.0.0-rc.1.tgz
```

This package builds and packs independently within the same pnpm workspace; no separate Git repository is needed.

## Usage

It performs a dry run by default and only writes with `--write`.

```bash
pnpm exec antdv-style-codemod src/components/Card.vue
pnpm exec antdv-style-codemod --write src/components/Card.vue
pnpm exec antdv-style-codemod -i src
pnpm exec antdv-style-codemod --write --input src/components
```

It inserts `createStyles`, rewrites `$style.root` references and removes migrated Less blocks. Directory mode recursively handles Vue sources, skipping components without Less CSS Modules, dependency/build directories and symbolic links. Files with diagnostics remain unchanged; other successful files may still be written. Dry-run is always the default.

Render migrated components under `ThemeProvider`. The tool does not rewrite the application's provider hierarchy.

## API and Coverage

Use the same asynchronous entrypoint as the CLI:

```ts
import { migrateVueSfcLess } from '@antdv-next/less2cssinjs'

const result = await migrateVueSfcLess(source, 'Card.vue')
const custom = await migrateVueSfcLess(source, 'Card.vue', {
  tokenMap: { brand: 'colorPrimary' },
})
```

`tokenMap` keys omit `@`; values name theme tokens. Provide custom tokens in the
theme and declare their TypeScript types. Custom dimension tokens should contain
the complete CSS string including units.

| Capability | Asynchronous API and CLI |
| --- | --- |
| Known Ant Design variables and breakpoints | Upstream mappings with reactive tokens and CSS length units |
| Nested classes, compounds, siblings, selector lists and pseudos | Preserve relationships, order and CSS Module identities |
| `:global(...)` / `:global { ... }` below local classes | Preserve global selectors, including `.ant-*` overrides |
| Top-level/nested media, supports, container and layer | Preserve source order |
| Repeated rules and declarations | Preserve CSS order instead of overwriting object properties |
| `.textOverflow()`, `.textOverflowMulti()`, `.clearfix()` | Reuse upstream zero-argument expansions |
| Local variables, functions, custom mixins, guards, loops | Explicit `--compile-less` |

Upstream 1.0.7 expands `textOverflowMulti()` to single-line ellipsis, despite its
name. This adapter preserves that behavior.

Generated classes combine module identities with a theme-dependent stylesheet
class. `:where()` qualification does not add specificity, and Vue `toRefs()`
retains theme reactivity. An `.ant-*` name alone does not imply global scope:
write `:global` explicitly under Vue CSS Modules.

Existing synchronous `transformLessToCreateStyles()` and `transformVueSfcLess()`
retain their conservative subset and return types. Use `migrateVueSfcLess()` for
the expanded coverage; the synchronous APIs are not equivalent to the new CLI.

## Compilation

Known Ant Design Less variables such as `@primary-color`, `@text-color`,
`@border-color-base` and `@border-radius-base` map to theme tokens. Generated
Vue code uses `toRefs()` to retain theme reactivity. Unknown or locally
redefined variables are not guessed to be tokens.

For local Less variables, functions, mixins, guards and loops, opt into compilation:

```bash
antdv-style-codemod --compile-less Component.vue
antdv-style-codemod --compile-less --write Component.vue
```

Use `await migrateVueSfcLess(source, filename, { compileLess: true })` or the
shortcut `await compileVueSfcLess(source, filename)`. It invokes the official
Less compiler before the same SFC migration checks.
Any failure returns the original source, not intermediate CSS. Compilation
evaluates local variables to static CSS; use token mapping for dynamic themes.
Use compilation only with trusted project source. Imports, plugins, inline
JavaScript and file-reading functions are disabled. Unresolved assets and
standalone global selectors still require manual migration. Local mixin
definitions take precedence over upstream helpers in compilation mode.
The Less compiler belongs only to the migration package, not the runtime.

## Safety Boundaries

The following leave the affected file unchanged with diagnostics:

- Uncompiled custom mixins, loops, Less functions, guards, local variables, escaped values and property merging.
- Unknown variables: unlike upstream's same-name token inference, an explicit `tokenMap` is required.
- Standalone global rules or selectors with local classes only inside functions such as `:not()` / `:is()` and no direct local class. Migrate these to `createGlobalStyle` or adjust their structure.
- Imports, plugins, inline JavaScript and file-reading functions. Imports are never silently discarded.
- Dynamic `$style[name]`, named/scoped CSS Modules, external scripts and script-side module access.
- Less and non-Less blocks sharing the default `$style` module, including `module="$style"`. The whole file is preserved to avoid changing which module supplies a class. Separately named non-Less modules remain untouched.
- Duplicate module classes across style blocks, `composes`, ICSS `:import` / `:export`, ID selectors, keyframes/font-face and unsafe at-rule expressions.

Recognized native CSS functions such as `calc()`, `var()`, colors and gradients
are preserved. Vue `v-bind()`, `:deep()` / `:slotted()` and unknown functions are
refused. Rewritten Vue templates are validated. Run component and visual
regression tests for each migration batch.

Template rewriting only supports inline HTML: `<template>` or
`<template lang="html">`. External templates (`<template src="...">`) and
preprocessed templates such as Pug are refused with a diagnostic and the
original file unchanged, including its CSS Module. Convert them to inline HTML
first or migrate their styles manually.

CSS Modules with `scoped` are rejected to preserve Vue's selector isolation. Relative, root-relative, or module asset paths in `url()` or `image-set()` also leave the file unchanged: convert them to asset imports manually before migration. Absolute HTTP(S), protocol-relative, `data:`, `blob:`, and `#fragment` URLs can be preserved.

When adding `<script setup>`, the normal script must have statically verifiable
options, such as a directly exported `{ name: 'Card' }` or
`defineComponent({ name: 'Card' })` using a named import from Vue
(`import { defineComponent } from 'vue'`, including aliases). Default exports
with `setup`, `mixins`, `extends`, spreads, computed keys, or an unknown options
source are refused. Merge existing `setup()` logic manually so the generated setup
cannot silently replace its return values.

At-rule parameters are also checked for Less variables, arithmetic, and unknown
functions. For example, `(min-width: (500px + 100px))` is refused instead of being
copied into invalid CSS. Native queries, aspect ratios, and supported CSS math
functions remain eligible for migration.
