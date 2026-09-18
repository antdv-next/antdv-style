# @antdv-next/less2cssinjs

Optional, conservative Vue SFC Less CSS Module migration to `antdv-style`
`createStyles`.

## Local Installation

This independent package lives in `packages/less2cssinjs`. The root runtime
package does not include the tool or its Vue/JavaScript/Less migration parsers.
It separately depends on CSS parsers for its runtime string transformer.
The split does not imply an npm release.

Run `pnpm install` and `pnpm pack:packages` at the repository root, then install
the resulting archive in the project to migrate:

```sh
pnpm add -D /path/to/antdv-style/artifacts/antdv-next-less2cssinjs-1.0.0-rc.1.tgz
```

## Usage

The executable name remains `antdv-style-codemod`, now provided by this package:

```sh
pnpm exec antdv-style-codemod src/components/Card.vue
pnpm exec antdv-style-codemod --write src/components/Card.vue
pnpm exec antdv-style-codemod --compile-less --write src/components/Card.vue
pnpm exec antdv-style-codemod --write -i src
```

The default is a dry run. Files with diagnostics are not rewritten.
Only inline HTML templates are eligible for automatic rewriting; external
templates and preprocessors such as Pug leave the source unchanged with a diagnostic.
Less and non-Less blocks sharing the default `$style` module (also
`module="$style"`) are refused with the whole file unchanged. Separately named
non-Less modules are preserved.

```ts
import { migrateVueSfcLess } from '@antdv-next/less2cssinjs'

const result = await migrateVueSfcLess(source, 'Card.vue')
```

Migrated application code imports `antdv-style`; this tool is not a browser runtime
dependency. Unsupported Less/Vue constructs are left unchanged with diagnostics.
Read `docs/en/guide/migrate-less-codemod.md` in the repository for the complete
safety boundaries; this is not a general Less compiler.

The asynchronous API and CLI reuse the pinned
`@chenshuai2144/less2cssinjs@1.0.7` token mappings and common mixin expansions.
Our Vue adapter preserves nested/local/global selectors, selector lists,
conditional rules and repeated declarations in source order. Unlike upstream,
it does not flatten ancestor relationships, guess unknown tokens or drop imports.
`tokenMap` explicitly maps additional variables to theme tokens. Standalone
global rules still require manual migration. No React/TSX rewrite is run.

The synchronous `transformVueSfcLess` and `transformLessToCreateStyles` APIs retain
their older conservative subset. `textOverflowMulti()` retains upstream's
single-line behavior. Directory input skips dependencies/build output and links.

Known Ant Design Less variables map to reactive theme tokens. Opt-in
`--compile-less` (or `await compileVueSfcLess(source, filename)`) evaluates local
variables, mixins, functions and loops with the official Less compiler before
applying the same conservative migration checks. Imports, plugins, JavaScript
and file-reading functions are disabled. Use trusted source only. Compilation
evaluates variables statically; it is not dynamic theme-token inference.
