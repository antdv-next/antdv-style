# Theme Customization

## Custom Tokens

Add application-specific tokens via `ThemeProvider`:

```vue
<ThemeProvider
  :custom-token="{
    brandColor: '#7c3aed',
    headerHeight: 64,
  }"
>
  <!-- token.brandColor and token.headerHeight available -->
</ThemeProvider>
```

### Dynamic Custom Tokens

`customToken` accepts a function for appearance-aware tokens:

```vue
<ThemeProvider
  :custom-token="({ token, appearance, isDarkMode }) => ({
    brandColor: isDarkMode ? '#a78bfa' : '#7c3aed',
    cardBg: isDarkMode ? token.colorBgElevated : '#faf5ff',
  })"
/>
```

### TypeScript Support

```typescript
declare module 'antdv-style' {
  interface CustomToken {
    brandColor: string
    headerHeight: number
    cardBg: string
  }
}
```

## Theme Override

Override antd's base theme via the `theme` prop:

```vue
<ThemeProvider
  :theme="{
    token: { colorPrimary: '#722ed1' },
  }"
>
```

Or dynamically based on appearance:

```vue
<ThemeProvider
  :theme="(appearance) => ({
    token: {
      colorPrimary: appearance === 'dark' ? '#a78bfa' : '#722ed1',
    },
  })"
/>
```
