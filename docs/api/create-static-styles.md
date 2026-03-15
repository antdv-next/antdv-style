# createStaticStyles

创建不依赖主题 Token 的样式，仅计算一次。

## 签名

```typescript
function createStaticStyles(
  factoryOrStyles: ((utils: StaticStyleUtils) => Record<string, CSSInterpolation | string>) | Record<string, CSSInterpolation | string>
): () => { styles: Record<string, string>; cx: (...classNames: ClassNamesArg[]) => string }
```

`createStaticStyles` 返回一个 composable（`useStaticStyles`）。样式只会在首次调用时计算一次并缓存 — 主题变化时不会重新执行。

## 工厂函数参数

传入工厂函数时，函数接收以下参数：

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `css` | `(styles: object) => string` | Emotion css 辅助函数，返回 class name |
| `cx` | `(...args) => string` | 合并 class name |
| `cssVar` | `Record<string, string>` | CSS 变量映射（静态，基于前缀） |
| `responsive` | `ResponsiveHelpers` | 响应式媒体查询辅助工具 |

与 `createStyles` 不同，这里没有 `token` — 此 API 适用于永远不需要读取设计 Token 的样式。

## 返回值

```typescript
{
  styles: Record<string, string>  // Class name 映射（计算一次后永久缓存）
  cx: (...classNames: ClassNamesArg[]) => string  // 合并 class name
}
```

## 示例

```vue
<script setup>
import { createStaticStyles } from 'antdv-style'

const useStyles = createStaticStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  hidden: {
    display: 'none',
  },
})

const { styles, cx } = useStyles()
</script>

<template>
  <div :class="styles.container">
    <slot />
  </div>
</template>
```

## 注意事项

- 样式在首次调用时计算一次后永久缓存 — 适合永远不会改变的布局或工具类。
- **不**需要 `<ThemeProvider>` — 可在任何地方使用。
- 需要依赖 Token 的样式请使用 `createStyles`。
