# useAntdTheme

获取 antd 主题信息，Token 字段展开在顶层。

## 签名

```typescript
function useAntdTheme(): ComputedRef<AntdTheme>

type AntdTheme = AntdToken & {
  stylish: Record<string, string>
}
```

## 说明

与 `useAntdToken()` 类似，但额外包含 `stylish` 字段。Token 字段展开在顶层（不是嵌套在 `.token` 里）。

```typescript
const theme = useAntdTheme()
theme.value.colorPrimary  // 直接访问
theme.value.stylish       // stylish 预设
```
