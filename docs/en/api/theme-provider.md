# ThemeProvider

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
| `prefixCls` | `string` | `'ant'` | Component class prefix |
| `iconPrefixCls` | `string` | `'anticon'` | Icon class prefix |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `appearanceChange` | `Appearance` | Fired when appearance changes |
| `themeModeChange` | `ThemeMode` | Fired when theme mode changes |

## Nesting

Inner ThemeProviders inherit parent's `themeMode` and `customToken`.
