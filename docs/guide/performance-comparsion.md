# CSS-in-JS 性能

## 动态值与长列表

<DynamicBenchmarkDemo />

<BenchmarkDemo />

此本地微基准测量当前浏览器中 Emotion 首次生成与重复生成相同规则的耗时和缓存数量，不代表页面渲染性能，也不是 React/Vue 或其他库的横向比较。结果随设备、开发模式和采样噪声变化。

性能差异主要来自样式生成发生的时机，而不是 API 名称本身。

## createStyles

`createStyles` 在组件 setup 中消费主题和 props，并缓存相同输入的结果。它适合动态主题、动态 props 和局部响应式样式。

成本包括：

- 读取 Vue 注入上下文；
- 序列化主题与 props 作为缓存键；
- 首次遇到一组输入时生成 Emotion class。

## createStaticStyles

`createStaticStyles` 在模块加载时生成一次 class，不创建 Vue effect，也不需要 `ThemeProvider`。通过 `cssVar` 仍可跟随 CSS 变量变化。

```ts
const styles = createStaticStyles(({ cssVar }) => ({
  root: { color: cssVar.colorText, background: cssVar.colorBgContainer },
}))
```

## 选择建议

| 场景 | 推荐 |
|---|---|
| 依赖组件 props | `createStyles` |
| 依赖 `isDarkMode` 或自定义外观 | `createStyles` |
| 只依赖 CSS 变量 | `createStaticStyles` |
| 大列表中的固定结构 | `createStaticStyles` |
| 全局 reset | `createGlobalStyle` |

不要为了理论性能提前放弃可维护性。先用 `createStyles` 完成实现，再通过 Vue DevTools、Performance 面板和真实列表规模确认热点。

<StaticStylesDemo />
