# useAntdStylish

Access current theme's stylish presets.

## Signature

```typescript
function useAntdStylish(): ComputedRef<Record<string, string>>
```

Returns stylish presets defined via ThemeProvider's `stylish` prop. Returns `{}` if none defined.
