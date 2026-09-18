# Migrating CSS Modules Global Overrides

CSS Modules use `:global` to escape local scoping. Emotion classes already provide scope, so remove the keyword and place the selector under a generated root class.

```ts
const useStyles = createStyles(({ css, prefixCls }) => ({
  root: css({
    [`& .${prefixCls}-btn`]: { fontWeight: 600 },
  }),
}))
```

Use `createGlobalStyle` only for genuine document-level rules such as resets and root backgrounds. Call its composable once in the root component; its managed style element is removed on unmount.
