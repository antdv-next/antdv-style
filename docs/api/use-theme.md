# useTheme

在组件内访问完整的已解析主题 Token。

## 签名

```typescript
function useTheme(): ComputedRef<Theme>
```

返回一个 `ComputedRef<Theme>`，在活跃主题变化时自动更新。

## Theme 对象

`Theme` 在 antdv-next 设计 Token 的基础上扩展了额外字段：

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `colorPrimary` | `string` | 主色 |
| `colorBgContainer` | `string` | 容器背景色 |
| `borderRadius` | `number` | 基础圆角（px） |
| `isDarkMode` | `boolean` | 是否处于暗色模式 |
| `appearance` | `Appearance` | 当前外观（`'light'` \| `'dark'`） |
| `prefixCls` | `string` | 组件 class 前缀 |
| `iconPrefixCls` | `string` | 图标 class 前缀 |
| `stylish` | `object` | `ThemeProvider` 提供的 Stylish 预设 |
| *(所有 antdv Token)* | — | 完整的 antdv-next Token 集合 |

## 示例

```vue
<script setup>
import { useTheme } from 'antdv-style'

const theme = useTheme()
</script>

<template>
  <div :style="{ color: theme.colorPrimary }">
    主题文字
  </div>
</template>
```

## 注意事项

- 必须在 `<ThemeProvider>` 的后代组件中调用。若找不到 Provider，会抛出错误。
- 返回的 `ComputedRef` 是响应式的 — 在 `computed` 或 `watchEffect` 中读取 `theme.value` 会追踪依赖。
- 在 `<template>` 中 ref 会自动解包：直接使用 `theme.colorPrimary` 即可。
