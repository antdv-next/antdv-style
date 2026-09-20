# CSS in JS 快速入门

CSS-in-JS 指在 JavaScript 或 TypeScript 中描述样式，并由运行时或编译期工具生成 CSS。对 Vue 应用来说，它最大的价值是可以直接使用组件 props、响应式状态和设计 Token。

## 基础形态

antdv-style 同时支持对象和模板字符串：

```ts
const useStyles = createStyles(({ css, token }) => ({
  card: css({
    padding: token.paddingLG,
    color: token.colorText,
    background: token.colorBgContainer,
  }),
  title: css`
    margin: 0;
    color: ${token.colorPrimary};
  `,
}))
```

两种写法最终都返回 class name 字符串。对象写法拥有更好的类型提示，模板字符串更接近传统 CSS，可按团队习惯混用。

## 在 Vue 中使用

`createStyles` 返回的是 composable。它必须在 `setup()` 中、并且位于 `ThemeProvider` 的后代组件内调用：

```vue
<script setup lang="ts">
import { toRefs } from 'vue'
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ css, token }) => ({
  root: css({ color: token.colorText }),
}))

const { styles } = toRefs(useStyles())
</script>

<template>
  <div :class="styles.root">Hello CSS-in-JS</div>
</template>
```

## 动态值与静态值

- 会随 props、主题或 Token 改变的样式使用 `createStyles`。
- 仅依赖 CSS 变量、断点和常量的样式使用 `createStaticStyles`。
- 页面级重置与选择器规则使用 `createGlobalStyle`。
- 不需要主题上下文的单条规则可直接使用 `css`。

这种划分能让运行时工作量保持可控，同时保留动态主题的灵活性。
