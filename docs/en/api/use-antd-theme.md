# useAntdTheme

Access antd theme with token fields spread at top level.

## Signature

```typescript
function useAntdTheme(): ComputedRef<AntdTheme>

type AntdTheme = AntdToken & {
  stylish: Record<string, string>
}
```

Token fields are spread at top level (not nested under `.token`):

```typescript
const theme = useAntdTheme()
theme.value.colorPrimary  // direct access
theme.value.stylish       // stylish presets
```
