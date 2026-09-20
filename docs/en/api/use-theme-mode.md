# useThemeMode

Access and control the current theme mode and appearance.

## Signature

```typescript
function useThemeMode(): ThemeModeContext
```

## Return Value

```typescript
interface ThemeModeContext {
  themeMode: Readonly<Ref<ThemeMode>>          // 'light' | 'dark' | 'auto'
  appearance: ComputedRef<Appearance>          // Resolved appearance: 'light' | 'dark'
  isDarkMode: ComputedRef<boolean>             // true when appearance is 'dark'
  browserPrefers: Ref<BrowserPrefers>          // OS-level preference: 'light' | 'dark'
  setAppearance: (appearance: Appearance) => void  // Override appearance
  setThemeMode: (themeMode: ThemeMode) => void     // Change theme mode
}
```

| Field | Description |
|-------|-------------|
| `themeMode` | The configured mode (`'light'`, `'dark'`, or `'auto'`). `'auto'` follows `browserPrefers`. |
| `appearance` | The effective appearance after resolving `'auto'` against `browserPrefers`. |
| `isDarkMode` | Shorthand boolean for `appearance === 'dark'`. |
| `browserPrefers` | The OS/browser color scheme preference detected via `prefers-color-scheme`. |
| `setAppearance` | Override the appearance without changing `themeMode`. |
| `setThemeMode` | Set the theme mode, including `'auto'`. |

## Example

```vue
<script setup>
import { useThemeMode } from 'antdv-style'

const { appearance, isDarkMode, setThemeMode } = useThemeMode()
</script>

<template>
  <button @click="setThemeMode(isDarkMode ? 'light' : 'dark')">
    Switch to {{ isDarkMode ? 'light' : 'dark' }} mode
  </button>
  <p>Current appearance: {{ appearance }}</p>
</template>
```

## Notes

- Must be called within a component that is a descendant of `<ThemeProvider>`. Throws if no provider is found.
- All returned refs and computed values are reactive.
- When `themeMode` is `'auto'`, `appearance` derives from `browserPrefers` which is kept in sync via `matchMedia`.
- An uncontrolled appearance override lasts until the next `setThemeMode` call. Controlled setters request parent updates through `appearanceChange` / `themeModeChange`; the effective value stays unchanged until the parent updates the prop.
