# Quick Start

## Installation

```bash
pnpm add antdv-style antdv-next
```

## Basic Setup

Wrap your app with antdv-next's `ConfigProvider` and antdv-style's `ThemeProvider`:

```vue
<!-- App.vue -->
<script setup>
import { ConfigProvider } from 'antdv-next'
import { ThemeProvider } from 'antdv-style'
</script>

<template>
  <ConfigProvider>
    <ThemeProvider>
      <router-view />
    </ThemeProvider>
  </ConfigProvider>
</template>
```

`ThemeProvider` automatically detects design tokens from `ConfigProvider` — no manual token passing needed.

## Your First Component

```vue
<script setup>
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ token, css }) => ({
  container: {
    backgroundColor: token.colorBgLayout,
    padding: `${token.paddingLG}px`,
    borderRadius: `${token.borderRadiusLG}px`,
  },
  card: css`
    background: ${token.colorBgContainer};
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowTertiary};

    &:hover {
      box-shadow: ${token.boxShadow};
    }
  `,
}))

const s = useStyles()
</script>

<template>
  <div :class="s.styles.container">
    <div :class="s.styles.card">
      Hello antdv-style!
    </div>
  </div>
</template>
```

## Custom Tokens

Extend the design system with your own tokens:

```vue
<ThemeProvider :custom-token="{ brandColor: '#7c3aed' }">
  <!-- token.brandColor available in all createStyles -->
</ThemeProvider>
```

Add TypeScript support:

```typescript
declare module 'antdv-style' {
  interface CustomToken {
    brandColor: string
  }
}
```

## Dark Mode

```vue
<ThemeProvider theme-mode="auto">
  <!-- Follows system preference -->
</ThemeProvider>
```

Switch programmatically:

```typescript
const { setThemeMode } = useThemeMode()
setThemeMode('dark')
```
