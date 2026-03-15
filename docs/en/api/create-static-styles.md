# createStaticStyles

Create styles that do not depend on the theme token and are computed only once.

## Signature

```typescript
function createStaticStyles(
  factoryOrStyles: ((utils: StaticStyleUtils) => Record<string, CSSInterpolation | string>) | Record<string, CSSInterpolation | string>
): () => { styles: Record<string, string>; cx: (...classNames: ClassNamesArg[]) => string }
```

`createStaticStyles` returns a composable (`useStaticStyles`). The styles are evaluated once and cached — they never re-run when the theme changes.

## Factory Argument

When passing a factory function it receives:

| Property | Type | Description |
|----------|------|-------------|
| `css` | `(styles: object) => string` | Emotion css helper — returns a class name |
| `cx` | `(...args) => string` | Merge class names |
| `cssVar` | `Record<string, string>` | CSS variable map (static, prefix-based) |
| `responsive` | `ResponsiveHelpers` | Responsive media-query helpers |

Unlike `createStyles`, there is no `token` — use this API for styles that never need to read design tokens.

## Return Value

```typescript
{
  styles: Record<string, string>  // Class name map (computed once, then cached)
  cx: (...classNames: ClassNamesArg[]) => string  // Merge class names
}
```

## Example

```vue
<script setup>
import { createStaticStyles } from 'antdv-style'

const useStyles = createStaticStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  hidden: {
    display: 'none',
  },
})

const { styles, cx } = useStyles()
</script>

<template>
  <div :class="styles.container">
    <slot />
  </div>
</template>
```

## Notes

- Styles are computed once at first call and cached permanently — ideal for layout or utility classes that never change.
- Does **not** require `<ThemeProvider>` — can be used anywhere.
- For token-dependent styles use `createStyles` instead.
