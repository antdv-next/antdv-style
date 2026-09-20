# Less 组件迁移

组件库迁移比应用迁移多两个约束：默认样式要易于覆写，且不能依赖宿主应用的单例上下文。

## 迁移前后

对应上游统计组件的 inline、vertical、horizontal 三种布局。上半部分保留静态 CSS，
下半部分用 Vue `createStyles` 读取主题；切换暗色后仅迁移版本随 Token 更新。
这里不依赖 React ProComponents，布局和响应式输入使用 Vue 实现。

<MigrationComparisonDemo />

<<< @/.vitepress/theme/components/MigrationComparisonDemo.vue

## 建立独立实例

```ts
export const {
  ThemeProvider: LibraryThemeProvider,
  createStyles: createLibraryStyles,
  cx,
} = createInstance({
  key: 'acme',
  prefixCls: 'acme',
  hashPriority: 'low',
})
```

在组件库入口提供 Provider，内部样式统一使用 `createLibraryStyles`。这样多个版本或多个微应用可以并存。

## 维持覆写契约

- 对外公开根 class 或 `classNames` 映射。
- 不把 Emotion 哈希写入测试快照或公共文档。
- 使用 `prefixCls` 生成稳定的结构 class。
- 优先通过 Token 暴露视觉配置，而不是要求消费者复制选择器。

## SSR 与发布

组件库不应在模块加载时访问 `window` 或 `document`。静态样式可在模块顶层创建；依赖主题的 composable 只能在组件 setup 中调用。发布前至少验证 ESM 构建、Vue 类型声明、SSR render 和多实例样式插入。
