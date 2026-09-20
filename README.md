# antdv-style

CSS-in-JS solution for [antdv-next](https://github.com/antdv-next/antdv-next), based on [Emotion](https://emotion.sh/).

[简体中文](./README.zh-CN.md)

- **Token System**: Auto-integrates with antdv-next's 500+ design tokens from ConfigProvider
- **Dark Mode**: `light` / `dark` / `auto` with system preference detection
- **Custom Theme**: Extend tokens and stylish presets via ThemeProvider
- **CSS Variables**: `cssVar.colorPrimary` → `var(--ant-color-primary)`
- **Responsive**: Token-driven breakpoints with callable utility and device aliases
- **Multi-instance**: `createInstance()` for micro-frontend isolation
- **SSR Safe**: No DOM access at import time, Emotion-based style extraction
- **TypeScript**: Module augmentation for custom token IntelliSense

## Quick Start

### Installation

```bash
pnpm add antdv-style antdv-next
```

### Create Styles

`ThemeProvider` must be an ancestor of the component that calls `useStyles()`. Install providers in the root and consume the theme in a child:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ConfigProvider } from 'antdv-next'
import { ThemeProvider } from 'antdv-style'
import StyledCard from './StyledCard.vue'
</script>

<template>
  <ConfigProvider>
    <ThemeProvider>
      <StyledCard />
    </ThemeProvider>
  </ConfigProvider>
</template>
```

```vue
<!-- StyledCard.vue -->
<script setup lang="ts">
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ token, css }) => ({
  // CSS object syntax
  container: {
    backgroundColor: token.colorBgLayout,
    borderRadius: token.borderRadiusLG,
    maxWidth: 400,
    width: '100%',
    padding: `${token.paddingLG}px`,
  },
  // CSS template literal syntax
  card: css`
    box-shadow: ${token.boxShadow};
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
    cursor: pointer;

    &:hover {
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
}))

const s = useStyles()
</script>

<template>
  <div :class="s.styles.container">
    <div :class="s.styles.card">createStyles Demo</div>
    <div>Current theme: {{ s.theme.appearance }}</div>
  </div>
</template>
```

## Workspace

The `antdv-style` runtime stays at the repository root (`src/`, `dist/`,
`package.json`). Only the two optional tools live under `packages/`:

| Directory | Package | Use |
| --- | --- | --- |
| `packages/vite-plugin-antdv-style` | `vite-plugin-antdv-style` | Vite automatic labels |
| `packages/less2cssinjs` | `@antdv-next/less2cssinjs` | Vue Less migration API and `antdv-style-codemod` CLI |

Both tools have independent dependencies, exports and build artifacts. They are
not runtime subpaths or production dependencies of `antdv-style`. The split does
not imply an npm release; their READMEs describe local archive installation.

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm docs:typecheck
pnpm docs:build
pnpm pack:packages
pnpm test:packages
```

`pnpm build:core` builds only the runtime. `pnpm --filter vite-plugin-antdv-style build`
and `pnpm --filter @antdv-next/less2cssinjs build` build each tool independently.
Archives are generated in `artifacts/`; packing does not publish anything.
`test:packages` installs each archive separately into a temporary directory using
the local pnpm store, then checks imports, types, CLI behavior and runtime SSR.

## License

[MIT](./LICENSE)
