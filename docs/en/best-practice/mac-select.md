# macOS-style Select

<MacSelectDemo />

This Vue example uses antdv-next Select for keyboard, focus and popup behavior, and styles the popup through `classes.popup.root`.

A custom select owns floating placement, keyboard navigation, focus management, and scrolling feedback. Use a proven headless or floating library for behavior and antdv-style for the visual layer.

```ts
const useStyles = createStyles(({ css, token }) => ({
  popup: css({
    minWidth: 220,
    padding: 6,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowSecondary,
  }),
  option: css({
    minHeight: 32,
    paddingInline: 10,
    '&[data-active=true]': {
      color: token.colorTextLightSolid,
      background: token.colorPrimary,
    },
  }),
}))
```

Use WAI-ARIA combobox/listbox semantics, support keyboard and IME behavior, align `StyleProvider.container` with portalled overlays, and respect reduced-motion preferences.
