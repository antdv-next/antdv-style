# createStylish

Create a reusable set of named class-name presets derived from the theme token.

## Signature

```typescript
function createStylish<T extends Record<string, string>>(
  factory: (utils: CreateStylesUtils) => T
): () => ComputedRef<T>
```

`createStylish` returns a composable. Call that composable inside a component's `setup` to get a reactive `ComputedRef<T>` that re-evaluates whenever the theme changes.

## Factory Argument

The `factory` receives the same `utils` object as `createStyles`:

| Property | Type | Description |
|----------|------|-------------|
| `token` | `Theme` | Full design token object |
| `css` | `(styles: object) => string` | Emotion css helper — returns a class name |
| `cx` | `(...args) => string` | Merge class names |
| `prefixCls` | `string` | Component class prefix |
| `isDarkMode` | `boolean` | Whether dark mode is active |
| `appearance` | `Appearance` | Current appearance (`'light'` \| `'dark'`) |
| `responsive` | `ResponsiveHelpers` | Responsive media-query helpers |
| `stylish` | `object` | Inherited stylish presets from `ThemeProvider` |
| `cssVar` | `Record<string, string>` | CSS variable map |

The factory must return a `Record<string, string>` where each value is a class name (typically produced by `css()`).

## Example

```vue
<script setup>
import { createStylish } from 'antdv-style'

const useCardStylish = createStylish(({ token, css }) => ({
  card: css({
    borderRadius: token.borderRadiusLG,
    padding: token.paddingLG,
    background: token.colorBgContainer,
    boxShadow: token.boxShadow,
  }),
  highlight: css({
    color: token.colorPrimary,
    fontWeight: token.fontWeightStrong,
  }),
}))

const stylish = useCardStylish()
</script>

<template>
  <div :class="stylish.card">
    <span :class="stylish.highlight">Hello</span>
  </div>
</template>
```

## Notes

- Must be called within a component that is a descendant of `<ThemeProvider>`.
- The returned `ComputedRef` updates reactively when the theme changes — use `stylish.xxx` directly in templates (no `.value` needed in `<template>`).
- Useful for defining shared presets once and reusing them across many components.
