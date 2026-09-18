# CSS in JS 写法对比

## Less / CSS Modules

传统方案把样式放在独立文件中，构建成本低、浏览器调试直观，但动态 Token 和运行时主题通常依赖额外变量层。

```less
.card {
  color: @text-color;
  background: @component-background;
}
```

## 行内样式

Vue 的 `:style` 很适合少量动态数值，但不支持伪类、媒体查询、关键帧和完整的选择器关系。

```vue
<div :style="{ color: active ? token.colorPrimary : token.colorText }" />
```

## styled 组件

styled 语法把样式与组件封装在一起，适合建立强约束的设计系统。Vue 生态并没有与 React `styled-components` 完全对等、且被本项目内置的实现，因此 antdv-style 不提供 `styled` 或 `setupStyled`。

## createStyles

`createStyles` 保留 CSS Modules 的“样式映射”心智，同时允许使用 Vue props 和主题上下文：

```ts
const useStyles = createStyles<{ active: boolean }>(
  ({ css, token }, props) => ({
    root: css({
      color: props.active ? token.colorPrimary : token.colorText,
      '&:hover': { color: token.colorPrimaryHover },
    }),
  }),
)
```

| 方案 | 动态主题 | 伪类/媒体查询 | Vue 响应式 | 推荐场景 |
|---|---:|---:|---:|---|
| CSS Modules | 依赖 CSS 变量 | 是 | 间接 | 大量静态样式 |
| `:style` | 是 | 否 | 是 | 少量动态值 |
| `createStaticStyles` | CSS 变量 | 是 | 否 | 高频、静态结构 |
| `createStyles` | 是 | 是 | 是 | 默认业务样式方案 |

默认从 `createStyles` 开始；确认样式只依赖 CSS 变量后，再切换到 `createStaticStyles`。
