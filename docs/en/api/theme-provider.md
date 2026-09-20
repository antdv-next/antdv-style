# ThemeProvider

<ThemeCompositionDemo />

ThemeProvider does not render a DOM wrapper. Native text does not acquire styles
from context alone; antdv-next's `App` scopes base styles such as text color to its
DOM subtree. Use `createStyles` for explicit element styles.

<ThemeVariantsDemo variant="controlled" />

<RuntimeCapabilitiesDemo variant="nested" />

<StaticMessageDemo />

<RuntimeCapabilitiesDemo variant="global" />

<CustomThemeDemo />

Theme context provider component. Auto-detects antdv-next tokens from `ConfigProvider`.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `themeMode` | `'light' \| 'dark' \| 'auto'` | `'light'` | Theme mode (controlled) |
| `defaultThemeMode` | `ThemeMode` | — | Default theme mode (uncontrolled) |
| `appearance` | `Appearance` | — | Override appearance (controlled) |
| `defaultAppearance` | `Appearance` | — | Default appearance (uncontrolled) |
| `theme` | `ThemeConfig \| (appearance) => ThemeConfig` | — | Antd theme override |
| `customToken` | `object \| (params) => object` | — | Custom token extension |
| `stylish` | `object \| (params) => object` | — | Stylish presets |
| `prefixCls` | `string` | inherited | Component prefix from parent ThemeProvider, instance defaults, or ConfigProvider |
| `iconPrefixCls` | `string` | inherited | Icon prefix |
| `customStylish` | `(params) => object` | — | Compatibility entry for functional stylish presets |
| `getStaticInstance` | `(instances) => void` | — | Receive contextual message, notification, and modal APIs |
| `staticInstanceConfig` | `object` | — | Holder configuration for message and notification |

The `customToken` function receives `{ token, appearance, isDarkMode }`. Functional `stylish`/`customStylish` also receives the merged token, built-in stylish presets, and `css`.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `appearanceChange` | `Appearance` | Fired when appearance changes |
| `themeModeChange` | `ThemeMode` | Fired when theme mode changes |

The same notifications are available through `onAppearanceChange` and `onThemeModeChange` props.

## Nesting

### Component Style Isolation

`theme.hashed` resolves from the local theme, then the ancestor ConfigProvider's
effective theme, then `true`. Without ancestor configuration, ThemeProvider
enables component hashing so providers sharing a `prefixCls` can use different
`theme.cssVar.prefix` values without reusing the wrong component CSS.
Native antdv-next ConfigProvider defaults hashing off; this does not modify that
global default.

```vue
<ThemeProvider :theme="{ hashed: true, cssVar: { prefix: 'brand' } }">
  <App />
</ThemeProvider>
```

An ancestor's effective `hashed: false` is inherited, even when it comes from
native ConfigProvider defaults. Explicitly set `theme.hashed: true` for independent
variable prefixes or runtime prefix changes. Explicit `false` remains supported,
but each component prefix must then keep a consistent variable prefix; use distinct,
stable `prefixCls` values for separate themes. Separate caches or `cssVar.key`
values do not replace selector isolation. This setting does not fix cross-ShadowRoot
style injection limitations; see [StyleProvider](./style-provider).

When not explicitly configured, an inner ThemeProvider reactively inherits theme mode, appearance, custom tokens, stylish presets, `prefixCls`, and `iconPrefixCls`. Local values override only their corresponding fields.

ThemeProvider also preserves an enclosing StyleProvider engine:

```vue
<StyleProvider cache-key="micro-app" :container="shadowRoot" nonce="nonce-value">
  <ThemeProvider><App /></ThemeProvider>
</StyleProvider>
```

## Per-instance Token Types

Libraries and micro-frontends can type an isolated instance without global module augmentation:

```ts
interface LibraryToken {
  brandColor: string
  headerHeight: number
}

export const libraryStyle = createInstance<LibraryToken>({
  key: 'library',
  customToken: { brandColor: '#1677ff', headerHeight: 56 },
})

libraryStyle.createStyles(({ token }) => ({
  root: { color: token.brandColor, height: token.headerHeight },
}))
```

## Static Instances

`getStaticInstance` returns message, notification, and modal APIs created inside the active ConfigProvider/ThemeProvider context. Use these instead of context-free global calls when theme, locale, or prefix configuration matters.
