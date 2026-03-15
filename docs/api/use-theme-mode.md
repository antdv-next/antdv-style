# useThemeMode

访问和控制当前的主题模式与外观。

## 签名

```typescript
function useThemeMode(): ThemeModeContext
```

## 返回值

```typescript
interface ThemeModeContext {
  themeMode: Readonly<Ref<ThemeMode>>          // 'light' | 'dark' | 'auto'
  appearance: ComputedRef<Appearance>          // 解析后的外观：'light' | 'dark'
  isDarkMode: ComputedRef<boolean>             // appearance 为 'dark' 时为 true
  browserPrefers: Ref<BrowserPrefers>          // 系统级偏好：'light' | 'dark'
  setAppearance: (appearance: Appearance) => void  // 覆盖外观
  setThemeMode: (themeMode: ThemeMode) => void     // 切换主题模式
}
```

| 字段 | 描述 |
|-------|-------------|
| `themeMode` | 已配置的模式（`'light'`、`'dark'` 或 `'auto'`）。`'auto'` 会跟随 `browserPrefers`。 |
| `appearance` | 将 `'auto'` 解析为 `browserPrefers` 后的实际外观。 |
| `isDarkMode` | `appearance === 'dark'` 的布尔简写。 |
| `browserPrefers` | 通过 `prefers-color-scheme` 检测到的系统/浏览器颜色方案偏好。 |
| `setAppearance` | 直接设置解析后的外观（将 `themeMode` 设置为给定值）。 |
| `setThemeMode` | 设置主题模式，包括 `'auto'`。 |

## 示例

```vue
<script setup>
import { useThemeMode } from 'antdv-style'

const { appearance, isDarkMode, setThemeMode } = useThemeMode()
</script>

<template>
  <button @click="setThemeMode(isDarkMode ? 'light' : 'dark')">
    切换到{{ isDarkMode ? '亮色' : '暗色' }}模式
  </button>
  <p>当前外观：{{ appearance }}</p>
</template>
```

## 注意事项

- 必须在 `<ThemeProvider>` 的后代组件中调用。若找不到 Provider，会抛出错误。
- 所有返回的 ref 和 computed 值均为响应式。
- 当 `themeMode` 为 `'auto'` 时，`appearance` 派生自 `browserPrefers`，后者通过 `matchMedia` 保持同步。
