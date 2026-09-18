# Customizing antdv-next Components

Prefer global and component tokens through `ThemeProvider.theme`. This path stays aligned with antdv-next state styles and theme algorithms.

<AntdOverrideDemo />

## Specificity and Semantic Nodes

<OverrideVariantsDemo />

The Vue Input uses `classes` with `root`, `input` and `suffix` nodes.
This serves the upstream `classNames` example without copying the older React
`affixWrapper` name.

<<< @/.vitepress/theme/components/OverrideVariantsDemo.vue

```vue
<ThemeProvider
  :theme="{
    token: { colorPrimary: '#d4380d', borderRadius: 4 },
    components: { Button: { controlHeight: 36 } },
  }"
>
  <App />
</ThemeProvider>
```

For details that component tokens cannot express, scope selectors below a business root and use the stable `prefixCls`:

```ts
const useStyles = createStyles(({ css, prefixCls }) => ({
  root: css({ [`& .${prefixCls}-btn`]: { fontWeight: 600 } }),
}))
```

Avoid generated hashes, accidental internal DOM structure, and `!important`.
