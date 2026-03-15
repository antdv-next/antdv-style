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

```vue
<script setup>
import { ConfigProvider } from 'antdv-next'
import { ThemeProvider, createStyles } from 'antdv-style'

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
  <ConfigProvider>
    <ThemeProvider>
      <div :class="s.styles.container">
        <div :class="s.styles.card">createStyles Demo</div>
        <div>Current theme: {{ s.theme.appearance }}</div>
      </div>
    </ThemeProvider>
  </ConfigProvider>
</template>
```

## License

[MIT](./LICENSE)
