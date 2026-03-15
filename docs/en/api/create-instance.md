# createInstance

Create an isolated antdv-style instance with its own Emotion cache and Vue injection context.

## Signature

```typescript
function createInstance(options?: CreateInstanceOptions): AntdvStyleInstance
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `string` | `'css'` | Emotion cache key — used as the CSS class prefix |
| `container` | `HTMLElement` | — | DOM node where `<style>` tags are inserted |
| `hashPriority` | `'high' \| 'low'` | — | Hash selector specificity for generated class names |
| `cssVarPrefix` | `string` | — | Prefix for CSS variable names |

## Return Value

The instance exposes every API function bound to its own isolated cache and context:

| Export | Description |
|--------|-------------|
| `ThemeProvider` | Scoped theme provider component |
| `StyleProvider` | Scoped style engine provider component |
| `createStyles` | Scoped `createStyles` |
| `createGlobalStyle` | Scoped `createGlobalStyle` |
| `createStylish` | Scoped `createStylish` |
| `createStaticStyles` | Scoped `createStaticStyles` |
| `useTheme` | Scoped `useTheme` composable |
| `useThemeMode` | Scoped `useThemeMode` composable |
| `useResponsive` | `useResponsive` (shared singleton, not scoped) |
| `useAntdToken` | Scoped `useAntdToken` composable |
| `useAntdStylish` | Scoped `useAntdStylish` composable |
| `useAntdTheme` | Scoped `useAntdTheme` composable |
| `css` | Emotion `css()` function |
| `cx` | Emotion `cx()` function |
| `keyframes` | Emotion `keyframes()` function |
| `injectGlobal` | Emotion `injectGlobal()` function |
| `cssVar` | CSS variable proxy |
| `responsive` | Static responsive helpers |
| `tokenToCSSVar` | Convert token to CSS variable reference |

## Example

```typescript
// my-design-system/style.ts
import { createInstance } from 'antdv-style'

export const {
  ThemeProvider,
  createStyles,
  useTheme,
  useThemeMode,
} = createInstance({
  key: 'my-ds',
  cssVarPrefix: 'my-ds',
})
```

```vue
<!-- App.vue -->
<script setup>
import { ThemeProvider, createStyles } from './style'

const useStyles = createStyles(({ token, css }) => ({
  root: css({ color: token.colorPrimary }),
}))

const s = useStyles()
</script>

<template>
  <ThemeProvider>
    <div :class="s.styles.root">Hello</div>
  </ThemeProvider>
</template>
```

## Notes

- Each instance has isolated Vue injection keys — multiple instances can coexist in the same app without conflicts.
- Use `createInstance` when building a design system library so consumers' own antdv-style instance does not interfere.
- `useResponsive` is not scoped — it always uses the global singleton regardless of instance.
