# useAntdToken

获取基础的 antd 设计 Token（不含 customToken 覆盖）。

## 签名

```typescript
function useAntdToken(): ComputedRef<AntdToken>
```

## 与 useTheme 的区别

| | `useAntdToken()` | `useTheme()` |
|---|---|---|
| antd token | 包含 | 包含 |
| customToken | 不包含 | 包含 |
| appearance/isDarkMode | 不包含 | 包含 |
