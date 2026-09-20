# 简介

`antdv-style` 是面向 Vue 3 和 [antdv-next](https://github.com/antdv-next/antdv-next) 的应用级 CSS-in-JS 方案。它以 Emotion 为样式引擎，把 antdv-next 的设计 Token、动态主题、响应式工具和 Vue 注入上下文组织成一套一致的开发体验。

## 动机

antdv-next 已经提供完整的 Token 系统和组件级 CSS-in-JS 基础设施，但业务应用仍需解决几个更上层的问题：如何在普通 Vue 组件中消费 Token、如何组织作用域样式、如何切换亮暗主题，以及如何把旧 Less 项目逐步迁移进来。

antdv-style 的目标不是替代 antdv-next 的组件样式引擎，而是补齐应用与二次封装组件库需要的工作流。

## 特性

- **内置 Token**：`createStyles`、`useTheme` 和 `useAntdToken` 自动消费最近的 `ThemeProvider`。
- **动态主题**：支持 `light`、`dark`、`auto` 以及自定义外观名称。
- **复合样式**：使用 `createStylish` 和 `customStylish` 管理可复用样式片段。
- **响应式工具**：同时提供 CSS 媒体查询和运行时断点状态。
- **静态样式路径**：`createStaticStyles` 适用于只依赖 CSS 变量的高频组件。
- **实例隔离**：`createInstance` 可隔离缓存、前缀、容器和 Vue 注入 key。
- **SSR 抽取**：`extractStaticStyle` 同时返回 CSS 文本和可直接写入 HTML 的标签。

## 与 @antdv-next/cssinjs 的区别

`@antdv-next/cssinjs` 负责 antdv-next 组件库本身的样式注册、哈希优先级和 SSR 缓存；antdv-style 建立在它与 Emotion 之上，提供更接近 CSS Modules 的应用层 API。组件库底层样式仍由 `@antdv-next/cssinjs` 管理，业务样式则可以使用 `createStyles`、`createGlobalStyle` 和 `createStaticStyles`。

## Vue 适配

antdv-style 的 API 设计针对 Vue 3 进行了适配：

| React 模式 | Vue 适配方式 |
|---|---|
| `useMemo` / `useContext` | `computed` / `provide` + `inject` |
| Hook 返回普通对象 | Composable 返回响应式代理 |
| `<Global>` 组件 | `createGlobalStyle` + 托管 `<style>` 标签 |
| `SerializedStyles` | Class name 字符串 |

下一步可从[快速开始](/guide/quick-start)安装基础环境，或直接阅读[使用 createStyles 书写样式](/guide/create-styles)。
