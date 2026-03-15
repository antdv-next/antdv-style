# 主题定制

## 自定义 Token

通过 `ThemeProvider` 添加应用特定的 Token：

```vue
<ThemeProvider
  :custom-token="{
    brandColor: '#7c3aed',
    headerHeight: 64,
  }"
>
  <!-- token.brandColor 和 token.headerHeight 均可使用 -->
</ThemeProvider>
```

### 动态自定义 Token

`customToken` 接受一个函数，用于根据外观动态生成 Token：

```vue
<ThemeProvider
  :custom-token="({ token, appearance, isDarkMode }) => ({
    brandColor: isDarkMode ? '#a78bfa' : '#7c3aed',
    cardBg: isDarkMode ? token.colorBgElevated : '#faf5ff',
  })"
/>
```

### TypeScript 支持

```typescript
declare module 'antdv-style' {
  interface CustomToken {
    brandColor: string
    headerHeight: number
    cardBg: string
  }
}
```

## 主题覆盖

通过 `theme` prop 覆盖 antd 的基础主题：

```vue
<ThemeProvider
  :theme="{
    token: { colorPrimary: '#722ed1' },
  }"
>
```

或根据外观动态覆盖：

```vue
<ThemeProvider
  :theme="(appearance) => ({
    token: {
      colorPrimary: appearance === 'dark' ? '#a78bfa' : '#722ed1',
    },
  })"
/>
```
