# useAntdStylish

Access current theme's stylish presets.

## Signature

```typescript
function useAntdStylish(): ComputedRef<FullStylish>
```

Returns the complete stylish collection. It always includes the built-in `buttonDefaultHover` preset and merges presets inherited from parent ThemeProviders with local custom presets.

```ts
const stylish = useAntdStylish()
stylish.value.buttonDefaultHover
```
