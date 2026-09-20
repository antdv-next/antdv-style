# createGlobalStyle

<RuntimeCapabilitiesDemo variant="global" />

Inject reactive global CSS that updates automatically when the theme changes.

## Signature

```typescript
function createGlobalStyle(
  factory: (utils: CreateStylesUtils) => Record<string, unknown> | string | void
): () => void
```

`createGlobalStyle` returns a composable (`useGlobalStyle`). Call that composable inside a component's `setup` to activate the styles. Styles are injected into the active Emotion engine container (`<head>` by default), honoring its nonce, insertion point, and Stylis configuration; they are removed when the component is unmounted.

## Factory Argument

The `factory` receives the same `utils` object as `createStyles`:

| Property | Type | Description |
|----------|------|-------------|
| `token` | `Theme` | Full design token object |
| `css` | `(styles: object) => string` | Emotion css helper |
| `cx` | `(...args) => string` | Merge class names |
| `prefixCls` | `string` | Component class prefix |
| `iconPrefixCls` | `string` | Icon class prefix |
| `isDarkMode` | `boolean` | Whether dark mode is active |
| `appearance` | `Appearance` | Current appearance (built-in `'light'` / `'dark'`, plus custom values) |
| `responsive` | `ResponsiveUtil` | Theme-breakpoint-aware responsive media-query helpers |
| `stylish` | `object` | Shared stylish presets |
| `cssVar` | `Record<string, string>` | CSS variable map |

The factory should return a selector-to-styles map (`Record<string, StyleObject>`) or a raw CSS string.

## Example

```vue
<script setup>
import { createGlobalStyle } from 'antdv-style'

const useGlobalStyle = createGlobalStyle(({ token, isDarkMode }) => ({
  body: {
    backgroundColor: isDarkMode ? token.colorBgContainer : '#fff',
    color: token.colorText,
  },
  'a, a:visited': {
    color: token.colorPrimary,
  },
}))

useGlobalStyle()
</script>
```

## Notes

- Within one engine, the main Emotion sheet (`css` / `createStyles` / `injectGlobal`)
  precedes the separate `createGlobalStyle` sheets, which follow hook mount order.
  Equal-priority rules cascade in that order, not the interleaved call order of
  class and global factories. `insertionPoint` positions the engine without
  reversing hook order. SSR extraction, hydration, and CSR use the same rule.
- An initially or temporarily empty factory retains its position. Updates do not
  move it; unmounting and remounting allocates a new position.
- Must be called within a component that is a descendant of `<ThemeProvider>`.
- The composable re-injects styles reactively whenever the theme changes.
- In SSR environments styles are injected via the Emotion cache for server-side extraction.
