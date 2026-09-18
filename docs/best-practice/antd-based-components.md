# 基于 antdv-next 封装组件库

## 建立库级实例

```ts
// styling.ts
export const styling = createInstance({
  key: 'acme',
  prefixCls: 'acme',
  hashPriority: 'low',
})
```

内部只使用 `styling.createStyles`，并导出 `styling.ThemeProvider` 作为可选顶层 Provider。独立 context key 可防止宿主应用中的同名 Provider 改变组件库内部行为。

## 主题契约

- 使用模块扩展声明库的 `CustomToken`。
- 为每个可定制视觉属性提供 Token，而不是选择器说明书。
- 使用 `prefixCls` 生成稳定结构 class。
- 支持 `class` / `classNames` 透传，允许消费者做最后一层微调。

## 打包约束

把 `vue`、`antdv-next` 和 `antdv-style` 声明为 peer dependency，避免重复 Vue 运行时和多份默认实例。组件库自己的隔离实例由代码创建，不需要把 antdv-style 打进 bundle。

## 验证

至少覆盖亮色、暗色、自定义前缀、嵌套 Provider、SSR 和两个版本并存的场景。
