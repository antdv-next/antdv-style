# 自定义 antdv-next 组件样式

## 优先使用主题配置

颜色、圆角、尺寸等设计属性应优先通过 `ThemeProvider.theme` 的全局 Token 或组件 Token 设置。这条路径与 antdv-next 的状态样式和主题算法保持一致。

<AntdOverrideDemo />

## 选择器权重与语义节点

<OverrideVariantsDemo />

本技术栈 Input 使用 `classes`，节点名为 `root` / `input` / `suffix`，
对应上游示例的 `classNames` 用途，不照搬 React 的旧 `affixWrapper` 名称。

<<< @/.vitepress/theme/components/OverrideVariantsDemo.vue

```vue
<ThemeProvider
  :theme="{
    token: { colorPrimary: '#d4380d', borderRadius: 4 },
    components: { Button: { controlHeight: 36 } },
  }"
>
  <App />
</ThemeProvider>
```

## 使用作用域选择器

组件 Token 无法覆盖的细节，可在业务容器下引用稳定前缀：

```ts
const useStyles = createStyles(({ css, prefixCls, token }) => ({
  root: css({
    [`& .${prefixCls}-btn`]: {
      fontWeight: 600,
      boxShadow: token.boxShadowTertiary,
    },
  }),
}))
```

避免依赖内部 DOM 层级、自动生成哈希或 `!important`。需要提高权重时，先确认样式插入顺序和 `StyleProvider.hashPriority`。
