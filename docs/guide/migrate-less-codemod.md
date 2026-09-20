# less2cssinjs

`@antdv-next/less2cssinjs` 是本项目独立的 Vue SFC Less 迁移工具包，通过 `antdv-style-codemod` 命令把安全的 Vue CSS Module Less 子集迁移为 `createStyles`。

## 用途与可选性

这是提供给使用 `antdv-style` 的业务开发者的可选代码迁移工具，不是本仓库内部的测试工具。只有需要将已有 Vue 项目的 Less CSS Modules 改写为 `createStyles` 时才需要运行；新项目、手动迁移或继续保留原有 Less 的项目都不必使用它。

工具在本地 Node.js 环境中按命令运行，不会在安装主包、启动应用或构建应用时自动迁移文件，也不参与浏览器中的样式运行。迁移后的代码使用 `antdv-style` 核心 API，不需要在业务代码中导入 codemod。

上游 `antd-style` 文档使用独立的 `@chenshuai2144/less2cssinjs`。本包实际依赖固定版本 `1.0.7`，调用其 token 映射与常见 mixin 转换；Vue SFC、CSS Modules 和主题响应式由本包适配。不会运行上游改写 React/TSX 文件的 CLI，也不会照搬可能改变层级关系的选择器扁平化行为。

命名保留上游的 `less2cssinjs`，将包作用域调整为 `@antdv-next`，以区分本项目的 Vue 实现。

## 包结构与安装

工具已拆分至同一仓库的 `packages/less2cssinjs`，包名为 `@antdv-next/less2cssinjs`。API 从该独立包导入，CLI 命令仍为 `antdv-style-codemod`，但由迁移工具包提供。主包保留在仓库根目录，不再提供迁移工具子路径或 CLI。

Vue、JavaScript 和 Less 解析依赖由迁移工具包独立声明，不再作为主包的工具依赖随之安装。只在需要迁移的业务项目中将此包加入开发依赖。

仓库内拆包已经完成，但这不代表已向 npm 发布。在仓库根目录执行 `pnpm install` 和 `pnpm pack:packages`，然后在待迁移项目中安装生成的包：

```bash
pnpm add -D /path/to/antdv-style/artifacts/antdv-next-less2cssinjs-1.0.0-rc.1.tgz
```

此包在同一 pnpm workspace 内独立构建和打包，无需另建 Git 仓库。

## 使用

默认只检查，传入 `--write` 才修改文件。

```bash
pnpm exec antdv-style-codemod src/components/Card.vue
pnpm exec antdv-style-codemod --write src/components/Card.vue
pnpm exec antdv-style-codemod -i src
pnpm exec antdv-style-codemod --write --input src/components
```

输入：

```vue
<template><div :class="$style.root" /></template>
<style module lang="less">
.root {
  color: red;
  &:hover { color: blue; }
}
</style>
```

工具会插入 `createStyles`、把 `$style.root` 改为 `styles.root`，并删除已迁移的 Less block。目录模式递归处理 Vue 文件，跳过没有 Less CSS Module 的组件、依赖/构建目录和符号链接。诊断文件不写入，其他成功文件仍可迁移；默认始终为 dry-run。

迁移后的组件须渲染在 `ThemeProvider` 下。工具不会自动改变应用的 Provider 层级。

## API 与能力

推荐使用与 CLI 相同的异步入口：

```ts
import { migrateVueSfcLess } from '@antdv-next/less2cssinjs'

const result = await migrateVueSfcLess(source, 'Card.vue')
// 明确指定自定义变量的映射，不猜测业务 Token。
const custom = await migrateVueSfcLess(source, 'Card.vue', {
  tokenMap: { brand: 'colorPrimary' },
})
```

`tokenMap` 的 key 不带 `@`，value 是主题 Token 名。自定义 Token 必须在主题中提供并声明相应 TypeScript 类型；带单位的自定义值应由主题提供完整 CSS 字符串。

| 能力 | 异步入口与 CLI |
| --- | --- |
| 已知 Ant Design Less 变量、断点查询 | 调用上游映射，保留动态 Token 和长度单位 |
| 嵌套 class、组合/兄弟选择器、逗号列表、伪类 | 保留关系、顺序和 CSS Modules 局部类名 |
| 本地 class 下的 `:global(...)` / `:global { ... }` | 保留全局选择器，支持组件 `.ant-*` 覆盖 |
| 顶层/嵌套 media、supports、container、layer | 支持，保留源顺序 |
| 重复规则、重复声明 | 保留 CSS 顺序，不覆盖成单个对象属性 |
| `.textOverflow()`、`.textOverflowMulti()`、`.clearfix()` | 复用上游展开；无参数调用，局部定义需编译模式 |
| 本地变量、函数、mixin、guard、循环 | 显式 `--compile-less` |

上游 `textOverflowMulti()` 在此版本中实际展开为单行省略，本包保留这一行为，不将它描述为多行截断。

生成代码使用模块标记类和主题相关的样式类，`:where()` 限定不增加选择器优先级；`toRefs()` 保留主题切换后的绑定更新。`.ant-*` 不会仅因名字而自动变为全局，Vue CSS Modules 中须明确写 `:global`。

原有同步 `transformLessToCreateStyles()`、`transformVueSfcLess()` 仍保留原来的保守子集和返回类型。需要上表扩展能力时使用 `migrateVueSfcLess()`，不要把同步 API 误当成新 CLI 的等价入口。

## 编译模式

常见 Ant Design Less 变量（例如 `@primary-color`、`@text-color`、
`@border-color-base`、`@border-radius-base`）可以直接映射为对应主题 Token。
生成代码使用 Vue `toRefs()` 保留切换主题后的样式更新。未知变量和本地重新定义的变量不会被猜测为 Token。

需要计算本地 Less 变量、函数、mixin、guard 或循环时，使用显式编译模式：

```bash
antdv-style-codemod --compile-less Component.vue
antdv-style-codemod --compile-less --write Component.vue
```

对应 API 为 `await migrateVueSfcLess(source, filename, { compileLess: true })`，或快捷入口 `await compileVueSfcLess(source, filename)`。它调用正式 Less 编译器，再执行相同的 Vue 迁移检查；失败返回原始文件，不留下中间 CSS。
编译模式会把本地变量求值为静态 CSS，并不会自动变成动态 Token；需要动态主题时使用上述 Token 映射。
仅对可信的项目源码使用编译模式。导入、插件、内联 JavaScript 和读取文件的函数均禁用，
编译结果中的未解析资源、独立全局规则等仍需人工处理。局部 mixin 定义优先于上游同名 helper。
Less 编译器依赖仅属于迁移工具包，不进入主包或浏览器运行时。

## 安全边界

以下内容返回诊断并保持对应文件不变：

- 未编译的自定义 mixin、循环、Less 函数、条件编译、局部变量、转义值和属性 merge；
- 未映射变量：上游会猜测为同名 Token，本包要求显式 `tokenMap`；
- 独立全局选择器，或仅在 `:not()` / `:is()` 等函数内包含本地类而没有直接本地 class 的选择器；应人工迁移到 `createGlobalStyle` 或调整结构；
- `@import`、插件、内联 JavaScript 和读取文件的函数；不会像上游一样静默忽略 import；
- 动态 `$style[name]` 等无法静态确定的模块引用；
- 命名 CSS Module、外部 script，以及脚本中的 `useCssModule()` / `$style` 访问；
- Less 与非 Less block 共用默认 `$style` 模块（包括 `module="$style"`）；此时整份文件保持不变，避免改变模块 class 的归属。使用其他独立名称的非 Less 模块会原样保留；
- 外部模板（`<template src="...">`）或 Pug 等非 HTML 模板；工具无法安全检查这些模板中的 `$style` 引用，因此不会删除对应的 CSS Module；
- 需要新增 `<script setup>`，但普通脚本的默认导出含 `setup`、`mixins`、`extends`、展开或计算属性，或无法静态确认其选项对象；
- 多个 style block 间重复的模块 class、`composes`、ICSS `:import` / `:export`、ID 选择器、keyframes/font-face 和无法安全求值的 at-rule 参数；
- 带 `scoped` 的 CSS Module，以及 Vue scoped CSS 的 `:deep()` / `:slotted()` 语义；
- `url()`、`image-set()` 中需要构建器解析的相对路径、根路径或模块资源路径，须先人工转换为资源 import。

这些场景需要人工映射到 Token、导入资源或重新设计选择器。完整 HTTP(S) URL、协议相对 URL、`data:` / `blob:` URL 和 `#fragment` 引用可保留。建议按目录分批运行，每批执行组件测试与视觉回归；CLI 不会在存在诊断时写入半成品。

模板自动改写仅支持内联 HTML，即普通 `<template>` 或 `<template lang="html">`。
外部模板和预处理模板须先人工转换为内联 HTML，或手动完成样式迁移。

`calc()`、`var()`、标准颜色和渐变等已识别的浏览器原生函数可以保留；Less 函数、计算、Vue `v-bind()` 和未识别函数会保守拒绝。改写后还会验证 Vue 模板语法。

普通脚本仅在能确认安全时才与新增的 `<script setup>` 共存，例如直接导出的
`{ name: 'Card' }` 或通过 `import { defineComponent } from 'vue'` 具名导入后
调用的 `defineComponent({ name: 'Card' })`（允许导入别名）。
已有 `setup()` 的组件请手动合并逻辑，避免 Vue 用新增的 setup 覆盖原有返回值。
at-rule 中的 `(min-width: (500px + 100px))` 等 Less 表达式不会被原样迁移为无效 CSS；
原生查询、宽高比与受支持的 CSS 数学函数仍可迁移。
