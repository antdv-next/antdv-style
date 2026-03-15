# useAntdToken

Access base antd design tokens (without customToken overlay).

## Signature

```typescript
function useAntdToken(): ComputedRef<AntdToken>
```

## vs useTheme

| | `useAntdToken()` | `useTheme()` |
|---|---|---|
| antd tokens | included | included |
| customToken | not included | included |
| appearance/isDarkMode | not included | included |
