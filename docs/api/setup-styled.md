# setupStyled

::: warning Vue 中不提供
`setupStyled` 是 upstream React styled 生态的占位 API，本项目没有对应导出。
:::

Vue 项目使用 [`createInstance`](/api/create-instance) 创建隔离的 Provider、样式工厂和 composable：

```ts
const style = createInstance({
  key: 'acme',
  prefixCls: 'acme',
  customToken: { brandRadius: 10 },
})
```

如果目标是把主题传给第三方 Vue styled 库，可在组件中调用 `useTheme()` 并显式桥接；antdv-style 不对第三方库的上下文和 SSR 行为作保证。
