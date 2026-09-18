# Reusable Stylish Presets

Stylish presets are reusable class name fragments for patterns such as interactive surfaces, focus rings, and elevated panels.

```ts
const useStylish = createStylish(({ css, token }) => ({
  interactive: css({
    cursor: 'pointer',
    transition: `all ${token.motionDurationMid}`,
    '&:hover': { borderColor: token.colorPrimary },
  }),
}))

const stylish = useStylish()
```

`useStylish()` returns a `ComputedRef`. Templates unwrap it automatically; scripts use `stylish.value.interactive`.

Use `ThemeProvider.customStylish` to publish application-wide presets. Extend the `CustomStylish` interface for TypeScript completion.

Stylish carries classes only. If a pattern also owns DOM structure, accessibility, or behavior, build a Vue component instead.
