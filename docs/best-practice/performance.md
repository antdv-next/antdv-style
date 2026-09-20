# 性能优化：createStyles 与 createStaticStyles

## 选择依据

`createStyles` 会读取 Vue 注入上下文、主题与 props，并在输入变化时重新计算。`createStaticStyles` 在模块加载时生成一次 class，不创建响应式 effect。

<StaticStylesDemo />

<DynamicBenchmarkDemo />

```ts
const styles = createStaticStyles(({ cssVar, responsive }) => ({
  card: {
    color: cssVar.colorText,
    background: cssVar.colorBgContainer,
    [responsive.mobile]: { padding: 12 },
  },
}))
```

## 优化顺序

1. 避免在 render 或循环中创建样式工厂。
2. 只把影响样式的最小 props 传入 `useStyles`。
3. 大列表的固定结构改用 `createStaticStyles`。
4. 复用 `createInstance`，不要为每个组件新建 Emotion cache。
5. 使用真实页面规模测量挂载、切换主题和滚动性能。

主题切换必须执行 JavaScript 的规则不能静态化；不要为了减少一次计算把可读性很差的条件逻辑塞进 CSS 变量。
