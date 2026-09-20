# 响应式工具

antdv-style 提供三种互补的响应式能力。

## responsive

默认导出的静态媒体查询映射适用于 `createStaticStyles`：

```ts
const styles = createStaticStyles(({ responsive }) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    [responsive.tablet]: { gridTemplateColumns: 'repeat(2, 1fr)' },
    [responsive.mobile]: { gridTemplateColumns: '1fr' },
  },
}))
```

键包括 `xs`、`sm`、`md`、`lg`、`xl`、`xxl`、`mobile`、`tablet`、`laptop` 和 `desktop`。

## createStyles 内的 responsive

动态 `responsive` 从当前主题 Token 读取断点，既可索引，也可调用：

```ts
const useStyles = createStyles(({ css, responsive }) => ({
  root: css({
    padding: 24,
    [responsive.mobile]: { padding: 12 },
  }),
  adaptive: css(responsive({
    mobile: { display: 'block' },
    desktop: { display: 'grid' },
  })),
}))
```

## useResponsive

如果渲染逻辑本身需要断点状态，使用 [`useResponsive`](/api/use-responsive)。纯视觉变化优先使用媒体查询，避免不必要的 JS 监听与水合差异。
