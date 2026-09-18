# Responsive Utilities

The package provides three complementary responsive APIs.

Use the static `responsive` map inside `createStaticStyles`, the token-aware callable `responsive` utility inside `createStyles`, and [`useResponsive`](/en/api/use-responsive) when render logic itself needs breakpoint state.

```ts
const styles = createStaticStyles(({ responsive }) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    [responsive.tablet]: { gridTemplateColumns: 'repeat(2, 1fr)' },
    [responsive.mobile]: { gridTemplateColumns: '1fr' },
  },
}))
```

Available keys are `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `mobile`, `tablet`, `laptop`, and `desktop`. Prefer CSS media queries for visual-only changes.
