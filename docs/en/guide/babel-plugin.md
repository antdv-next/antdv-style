# vite-plugin-antdv-style

`vite-plugin-antdv-style` analyzes TypeScript, JavaScript, and Vue SFC scripts.
By default, it injects a project-relative file path plus variable name as the `createStyles` label.

## Purpose and Optional Use

This is an optional debugging tool for developers using `antdv-style` in their applications, not an internal test tool for this repository. Readable class labels help identify the `createStyles` variable associated with a style. Without the plugin, `createStyles`, theming, and other core styling features still work; labels can also be specified manually.

The plugin runs only in Vite development mode by default. Production builds do not inject debug labels.
It does not execute in the browser or turn runtime styling into compile-time-only CSS.

This package actually depends on and calls the path-metadata visitor from
`babel-plugin-antd-style@1.0.4`, adapting its `__BABEL_FILE_NAME__` to our `label`.
Applications still configure Vite, not a separate Babel pipeline.

Upstream normalization drops `src` and `index` and keeps the portion before the
first dot in each path segment: `Button.styles.ts` becomes `Button`. Our adapter
appends the variable name when present; default-exported calls use the path alone.
Absolute paths are not exposed; files outside the root and `node_modules` are skipped.

Vue SFC extraction, aliases, binding checks, option preservation and source maps
remain in the adapter. Shadowed local functions are not passed to upstream.
When upstream disables itself under `NODE_ENV=production`, explicit
`devOnly: false` uses the same path rules without changing the process environment.

The name follows the upstream `toolchain-plugin-library` pattern: `babel-plugin-antd-style` becomes `vite-plugin-antdv-style`, keeping Vite in the name to identify the actual toolchain integration.

## Package Layout and Installation

The plugin lives in `packages/vite-plugin-antdv-style` in the same repository and is imported from `vite-plugin-antdv-style`. The runtime package stays at the repository root and no longer exports a plugin subpath.

The plugin owns its parsing and source-rewriting dependencies. Installing `antdv-style` alone does not install additional parsers for this tool. Add the plugin as a development dependency only when automatic labels are needed.

The repository split is complete; this does not imply an npm release. Run `pnpm install` and `pnpm pack:packages` at the repository root, then install the resulting archive in the application:

```bash
pnpm add -D /path/to/antdv-style/artifacts/vite-plugin-antdv-style-1.0.0-rc.1.tgz
```

Local development uses pnpm workspaces. The plugin can build and pack independently without a separate Git repository.

## Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { antdvStyleLabel } from 'vite-plugin-antdv-style'

export default defineConfig({
  plugins: [antdvStyleLabel(), vue()],
})
```

Place the label plugin before Vue. To retain the older variable-only labels in both development and production:

```ts
export default defineConfig({
  plugins: [antdvStyleLabel({ devOnly: false, labelFormat: 'variable' }), vue()],
})
```

When building server and client bundles separately, keep the label plugin's activation conditions consistent so the same styles receive the same class names.

This input in `src/profile/style.ts`:

```ts
import { createStyles } from 'antdv-style'
const useProfileStyles = createStyles(({ css, token }) => ({
  root: css({ color: token.colorPrimary }),
}))
```

is transformed as if it were written with:

```ts
const useProfileStyles = createStyles(
  ({ css, token }) => ({ root: css({ color: token.colorPrimary }) }),
  { label: 'profile-style-useProfileStyles' },
)
```

Existing options and explicit labels are preserved. Aliased named imports are supported.

If the second argument contains a spread (such as `{ ...shared }`) or a computed
property, the entire call is left unchanged: either may supply a runtime `label`.
No automatic label is injected over shared or dynamically keyed options.

## Options

```ts
antdvStyleLabel({
  include: /src/,
  exclude: /node_modules/,
  importSources: ['antdv-style', '@acme/design-style'],
  labelFormat: 'path',
  devOnly: true,
  // root: '/project', // defaults to Vite root
})
```

The plugin only changes named `createStyles` imports from configured sources and emits high-resolution source maps. Dynamic member calls and non-object second arguments are intentionally left unchanged; pass an explicit `label` in those cases.

Standalone `transformStyleLabels()` retains variable-only labels by default and
does not know the Vite mode. Pass `{ labelFormat: 'path', root }` for path labels.
