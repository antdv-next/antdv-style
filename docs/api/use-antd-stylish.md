# useAntdStylish

获取当前主题的 stylish 预设样式集合。

## 签名

```typescript
function useAntdStylish(): ComputedRef<Record<string, string>>
```

## 说明

返回通过 `ThemeProvider` 的 `stylish` prop 定义的样式预设。如果没有定义则返回 `{}`。
