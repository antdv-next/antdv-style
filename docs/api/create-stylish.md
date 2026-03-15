# createStylish

创建一组基于主题 Token 派生的、可复用的具名 class name 预设。

## 签名

```typescript
function createStylish<T extends Record<string, string>>(
  factory: (utils: CreateStylesUtils) => T
): () => ComputedRef<T>
```

`createStylish` 返回一个 composable。在组件的 `setup` 中调用该 composable，可获得一个响应式的 `ComputedRef<T>`，在主题变化时会自动重新计算。

## 工厂函数参数

`factory` 接收与 `createStyles` 相同的 `utils` 对象：

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `token` | `Theme` | 完整的设计 Token 对象 |
| `css` | `(styles: object) => string` | Emotion css 辅助函数，返回 class name |
| `cx` | `(...args) => string` | 合并 class name |
| `prefixCls` | `string` | 组件 class 前缀 |
| `isDarkMode` | `boolean` | 是否处于暗色模式 |
| `appearance` | `Appearance` | 当前外观（`'light'` \| `'dark'`） |
| `responsive` | `ResponsiveHelpers` | 响应式媒体查询辅助工具 |
| `stylish` | `object` | 从 `ThemeProvider` 继承的 Stylish 预设 |
| `cssVar` | `Record<string, string>` | CSS 变量映射 |

工厂函数必须返回 `Record<string, string>`，其中每个值都是一个 class name（通常由 `css()` 生成）。

## 示例

```vue
<script setup>
import { createStylish } from 'antdv-style'

const useCardStylish = createStylish(({ token, css }) => ({
  card: css({
    borderRadius: token.borderRadiusLG,
    padding: token.paddingLG,
    background: token.colorBgContainer,
    boxShadow: token.boxShadow,
  }),
  highlight: css({
    color: token.colorPrimary,
    fontWeight: token.fontWeightStrong,
  }),
}))

const stylish = useCardStylish()
</script>

<template>
  <div :class="stylish.card">
    <span :class="stylish.highlight">Hello</span>
  </div>
</template>
```

## 注意事项

- 必须在 `<ThemeProvider>` 的后代组件中调用。
- 返回的 `ComputedRef` 在主题变化时响应式更新 — 在 `<template>` 中可直接使用 `stylish.xxx`（无需 `.value`）。
- 适合将共享的样式预设定义一次，在多个组件中复用。
