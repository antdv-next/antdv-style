# Dark Mode

## Theme Modes

`ThemeProvider` supports three modes via `themeMode`:

| Mode | Behavior |
|------|----------|
| `'light'` | Always light (default) |
| `'dark'` | Always dark |
| `'auto'` | Follows system preference |

```vue
<ThemeProvider theme-mode="auto">
  <App />
</ThemeProvider>
```

## Programmatic Switching

Use `useThemeMode()` to read and control theme:

```typescript
const { appearance, isDarkMode, setThemeMode, setAppearance } = useThemeMode()

// Switch mode
setThemeMode('dark')

// Or set appearance directly
setAppearance('dark')
```

## Using in Styles

```typescript
const useStyles = createStyles(({ token, isDarkMode, css }) => ({
  panel: css`
    background: ${isDarkMode ? token.colorBgElevated : token.colorBgContainer};
    transition: background 0.3s;
  `,
}))
```

## Nested ThemeProviders

Inner ThemeProviders inherit from outer ones:

```vue
<ThemeProvider theme-mode="light">
  <!-- light -->
  <ThemeProvider theme-mode="dark">
    <!-- dark, inherits parent's customToken -->
  </ThemeProvider>
</ThemeProvider>
```
