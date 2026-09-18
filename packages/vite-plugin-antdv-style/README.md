# vite-plugin-antdv-style

Optional Vite plugin that adds project-relative path and variable labels to `antdv-style` `createStyles`
calls in TypeScript, JavaScript and Vue single-file components.

## Local Installation

This independent package lives in `packages/vite-plugin-antdv-style`; the runtime
stays at the repository root. The split does not imply an npm release.

Run `pnpm install` and `pnpm pack:packages` at the repository root, then install
the archive as a development dependency in the consuming project:

```sh
pnpm add -D /path/to/antdv-style/artifacts/vite-plugin-antdv-style-1.0.0-rc.1.tgz
```

## Usage

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { antdvStyleLabel } from 'vite-plugin-antdv-style'

export default defineConfig({
  plugins: [antdvStyleLabel(), vue()],
})
```

The plugin runs only in development by default. Set `devOnly: false` and
`labelFormat: 'variable'` to retain the older build-time variable labels.
Keep server/client settings consistent for SSR. Explicit labels are preserved.

Exports: `antdvStyleLabel` (also the default export), `transformStyleLabels`,
`StyleLabelPluginOptions` and `StyleLabelTransformResult`.

Its parser dependencies belong to this package, not the runtime's production
dependencies. It calls the pinned `babel-plugin-antd-style@1.0.4` visitor for path
metadata and adapts it to `label`. Applications configure Vite, not Babel.
SFC extraction, binding safety, existing options and source maps remain Vue/Vite
adapter responsibilities. Default-exported factories are supported in path mode.
See `docs/en/guide/babel-plugin.md` in the repository for options and limitations.
