# useTheme

Access the full resolved theme token inside a component.

## Signature

```typescript
function useTheme(): ComputedRef<Theme>
```

Returns a `ComputedRef<Theme>` that updates whenever the active theme changes.

## Theme Object

`Theme` extends the antdv-next design token with additional fields:

| Field | Type | Description |
|-------|------|-------------|
| `colorPrimary` | `string` | Primary brand color |
| `colorBgContainer` | `string` | Container background color |
| `borderRadius` | `number` | Base border radius (px) |
| `isDarkMode` | `boolean` | Whether dark mode is active |
| `appearance` | `Appearance` | Current appearance (`'light'` \| `'dark'`) |
| `prefixCls` | `string` | Component class prefix |
| `iconPrefixCls` | `string` | Icon class prefix |
| `stylish` | `object` | Stylish presets from `ThemeProvider` |
| *(all antdv tokens)* | — | Full antdv-next token set |

## Example

```vue
<script setup>
import { useTheme } from 'antdv-style'

const theme = useTheme()
</script>

<template>
  <div :style="{ color: theme.colorPrimary }">
    Themed text
  </div>
</template>
```

## Notes

- Must be called within a component that is a descendant of `<ThemeProvider>`. Throws if no provider is found.
- The returned `ComputedRef` is reactive — reading `theme.value` in a `computed` or `watchEffect` tracks the dependency.
- In `<template>` the ref is auto-unwrapped: use `theme.colorPrimary` directly.
