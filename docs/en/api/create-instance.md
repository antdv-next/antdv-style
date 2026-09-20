# createInstance

<RuntimeCapabilitiesDemo variant="instance" />

<StyleEngineDemo />

Create an isolated antdv-style instance with its own Emotion cache and Vue injection context.

## Signature

```typescript
function createInstance<TToken extends object = CustomToken>(
  options?: CreateInstanceOptions<TToken>,
): CreateInstanceResult<TToken>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `string` | `'zcss'` | Emotion cache key used as the CSS class prefix |
| `container` | `Node` | — | DOM node where `<style>` tags are inserted |
| `hashPriority` | `'high' \| 'low'` | `'high'` | Selector priority for generated classes; `low` uses `:where()` |
| `cssVarPrefix` | `string` | `prefixCls` or `'ant'` | Prefix for CSS variable names |
| `prefixCls` | `string` | `'ant'` | antdv-next component class prefix |
| `iconPrefixCls` | `string` | `'anticon'` | antdv-next icon class prefix |
| `speedy` | `boolean` | `false` | Enable Emotion CSSOM speedy mode |
| `nonce` | `string` | — | CSP nonce written to Emotion style tags |
| `insertionPoint` | `HTMLElement` | — | Emotion style insertion point |
| `stylisPlugins` | `StylisPlugin[]` | — | Stylis plugins passed to Emotion |
| `customToken` | `TToken` | — | Instance-level custom token defaults propagated to style and theme APIs |

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
| `useResponsive` | Nearest ConfigProvider breakpoints; listeners are shared only for matching configurations |
| `useAntdToken` | Scoped `useAntdToken` composable |
| `useAntdStylish` | Scoped `useAntdStylish` composable |
| `useAntdTheme` | Scoped `useAntdTheme` composable |
| `css` | Emotion `css()` function |
| `cx` | Emotion `cx()` function |
| `keyframes` | Emotion `keyframes()` function |
| `injectGlobal` | Emotion `injectGlobal()` function |
| `cssVar` | CSS variable proxy |
| `responsive` | Static responsive helpers |
| `tokenToCSSVar` | Convert tokens to CSS variable declaration text |
| `styleManager` | Raw Emotion instance for `extractStaticStyle` or `createCacheManager` |
| `staticStylesCache` | Static-style cache owned by this instance |
| `dispose` | Unregister the instance and flush Emotion styles; safe to call repeatedly |

## Example

```typescript
// my-design-system/style.ts
import { createInstance } from 'antdv-style'

interface DesignToken {
  brandColor: string
}

export const {
  ThemeProvider,
  createStyles,
  useTheme,
  useThemeMode,
  dispose,
} = createInstance<DesignToken>({
  key: 'my-ds',
  cssVarPrefix: 'my-ds',
  customToken: { brandColor: '#1677ff' },
})
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ThemeProvider } from './style'
import StyledCard from './StyledCard.vue'
</script>

<template>
  <ThemeProvider><StyledCard /></ThemeProvider>
</template>
```

```vue
<!-- StyledCard.vue -->
<script setup lang="ts">
import { createStyles } from './style'

const useStyles = createStyles(({ token, css }) => ({
  root: css({ color: token.brandColor }),
}))

const s = useStyles()
</script>

<template>
  <div :class="s.styles.root">Hello</div>
</template>
```

## Notes

- Each instance has isolated Vue injection keys — multiple instances can coexist in the same app without conflicts.
- Use `createInstance` when building a design system library so consumers' own antdv-style instance does not interfere.
- `useResponsive` uses the nearest ConfigProvider at the call site, not the instance's private injection keys. Matching breakpoint configurations share listeners; different configurations stay isolated and react to token changes.
- In SSR, create one instance per request and call `dispose()` after extracting its styles.
- When using CSP, pass `nonce`; extracted Emotion style tags preserve it on the server.
