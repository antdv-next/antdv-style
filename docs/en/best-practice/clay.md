# Clay UI

<ClayDemo />

Clay styling combines soft surfaces, large radii, and layered shadows. Derive colors from tokens so the result remains readable in light and dark themes.

```ts
const useClayStyles = createStyles(({ css, token }) => ({
  panel: css({
    padding: 24,
    borderRadius: 24,
    color: token.colorText,
    background: token.colorBgContainer,
    boxShadow: `12px 12px 24px ${token.colorFillSecondary}`,
  }),
}))
```

Do not communicate button state through shadows alone. Keep borders, color changes, and a clear focus ring. Reduce large blurred shadow layers in long lists.
