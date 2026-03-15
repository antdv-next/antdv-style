# 简介

antdv-style 是 [antdv-next](https://github.com/antdv-next/antdv-next) 的 CSS-in-JS 解决方案，基于 [Emotion](https://emotion.sh/) 构建。它提供了一种无缝的方式来在组件样式中使用 antdv-next 的 Token 系统。

## 为什么选择 antdv-style？

antdv-next 提供了强大的基于 Token 的设计系统，包含 500+ 设计变量。antdv-style 让你可以轻松地在组件样式中使用这些 Token：

- 编写样式时享有完整的 Token 访问能力和 IDE IntelliSense 支持
- 通过一个 prop 在亮色/暗色模式之间切换
- 使用 `createStylish` 创建可复用的样式预设
- 利用 Token 驱动的断点构建响应式布局
- 在微前端场景中隔离样式

## Vue 适配

antdv-style 的 API 设计针对 Vue 3 进行了适配：

| React 模式 | Vue 适配方式 |
|---|---|
| `useMemo` / `useContext` | `computed` / `provide` + `inject` |
| Hook 返回普通对象 | Composable 返回响应式代理 |
| `<Global>` 组件 | `injectGlobal` + 托管 `<style>` 标签 |
| `SerializedStyles` | Class name 字符串 |

