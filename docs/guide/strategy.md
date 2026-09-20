# 设计理念与实施策略

## 应用层优先

antdv-style 面向业务应用和基于 antdv-next 的二次封装组件库。底层组件样式继续由 `@antdv-next/cssinjs` 管理，应用样式使用更轻量的 `createStyles` 心智。

## Token 是主题契约

颜色、间距、圆角、阴影和断点都应优先来自 Token。这样同一份样式可以响应主题算法、自定义 Token 与嵌套 Provider，而不需要在组件中维护重复常量。

## 动态能力按需使用

1. 常量和 CSS 变量样式使用 `createStaticStyles`。
2. 依赖主题或 props 的样式使用 `createStyles`。
3. 跨组件复用的样式片段使用 `createStylish`。
4. 页面级选择器使用 `createGlobalStyle`。

## Vue 响应式边界

样式 composable 在 `setup()` 中创建，并通过响应式 props getter消费状态：

```ts
import { toRefs } from 'vue'
import { createStyles } from 'antdv-style'

const props = defineProps<{ compact: boolean }>()

const useStyles = createStyles<{ compact: boolean }>(
  ({ css, token }, value) => ({
    root: css({ padding: value.compact ? token.paddingXS : token.paddingLG }),
  }),
)

const { styles } = toRefs(useStyles(() => ({ compact: props.compact })))
```

不要在 render 循环中重复创建 `createStyles`。缓存键由主题和 props 的自定义序列化生成，支持循环引用、BigInt、函数等输入；无法安全生成缓存键的非普通对象会跳过共享结果缓存。大型对象仍会增加缓存键计算成本，建议只传入样式需要的字段。工厂应是主题与 props 的纯函数，响应式状态通过 getter 显式传入，详见 [`createStyles` 的响应式输入与缓存](/api/create-styles#响应式输入与缓存)。

## 渐进迁移

旧项目无需一次重写。可以按组件把 Less Modules 迁移为 `style.ts`，保留 DOM 结构和 class 语义，再逐步把硬编码值替换为 Token。详见[从 Less 迁移](/guide/migrate-less-application)。
