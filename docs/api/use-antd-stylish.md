# useAntdStylish

获取当前主题的 stylish 预设样式集合。

## 签名

```typescript
function useAntdStylish(): ComputedRef<FullStylish>
```

## 说明

返回当前主题的完整 Stylish 集合。它始终包含内置的 `buttonDefaultHover`，并合并父级 ThemeProvider 与当前 ThemeProvider 的自定义预设。

```ts
const stylish = useAntdStylish()
stylish.value.buttonDefaultHover
```
