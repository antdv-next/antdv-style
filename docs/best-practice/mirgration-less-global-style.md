# 迁移 CSS Modules 全局覆盖

CSS Modules 常用 `:global` 绕过局部作用域。迁移到 Emotion 后，生成 class 已经提供作用域，不需要保留 `:global` 关键字。

## 局部覆盖

```less
.root :global(.ant-btn) {
  font-weight: 600;
}
```

迁移为：

```ts
const useStyles = createStyles(({ css, prefixCls }) => ({
  root: css({
    [`& .${prefixCls}-btn`]: { fontWeight: 600 },
  }),
}))
```

## 文档级全局样式

真正的全局 reset 使用 `createGlobalStyle`：

```ts
const useGlobalStyle = createGlobalStyle(({ token }) => ({
  'html, body': {
    margin: 0,
    color: token.colorText,
    background: token.colorBgLayout,
  },
}))
```

在根组件 setup 中调用一次 `useGlobalStyle()`。组件卸载时托管的 `<style>` 会一起移除。
