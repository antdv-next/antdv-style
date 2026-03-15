# 暗色模式

## 主题模式

`ThemeProvider` 通过 `themeMode` 支持三种模式：

| 模式 | 行为 |
|------|----------|
| `'light'` | 始终亮色（默认） |
| `'dark'` | 始终暗色 |
| `'auto'` | 跟随系统偏好 |

```vue
<ThemeProvider theme-mode="auto">
  <App />
</ThemeProvider>
```

## 编程控制切换

使用 `useThemeMode()` 读取和控制主题：

```typescript
const { appearance, isDarkMode, setThemeMode, setAppearance } = useThemeMode()

// 切换模式
setThemeMode('dark')

// 或直接设置外观
setAppearance('dark')
```

## 在样式中使用

```typescript
const useStyles = createStyles(({ token, isDarkMode, css }) => ({
  panel: css`
    background: ${isDarkMode ? token.colorBgElevated : token.colorBgContainer};
    transition: background 0.3s;
  `,
}))
```

## 嵌套 ThemeProvider

内层 ThemeProvider 会从外层继承配置：

```vue
<ThemeProvider theme-mode="light">
  <!-- 亮色 -->
  <ThemeProvider theme-mode="dark">
    <!-- 暗色，继承父级的 customToken -->
  </ThemeProvider>
</ThemeProvider>
```
