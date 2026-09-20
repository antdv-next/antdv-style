# antdv-style

[antdv-next](https://github.com/antdv-next/antdv-next) 的 CSS-in-JS 解决方案，基于 [Emotion](https://emotion.sh/)。

[English](./README.md)

- **Token 系统**：自动集成 antdv-next ConfigProvider 提供的 500+ 设计 Token
- **暗色模式**：支持 `light` / `dark` / `auto`，可跟随系统偏好
- **主题定制**：通过 ThemeProvider 扩展自定义 Token 和 Stylish 预设
- **CSS 变量**：`cssVar.colorPrimary` → `var(--ant-color-primary)`
- **响应式**：Token 驱动的断点工具，支持函数调用和设备别名
- **多实例**：`createInstance()` 为微前端场景提供隔离
- **SSR 安全**：导入时不访问 DOM，支持 Emotion 样式提取
- **TypeScript**：通过模块增强为自定义 Token 提供完整 IntelliSense

## 快速开始

### 安装

```bash
pnpm add antdv-style antdv-next
```

### 创建样式

`ThemeProvider` 必须位于调用 `useStyles()` 的组件上层。根组件负责安装 Provider，子组件消费主题：

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ConfigProvider } from 'antdv-next'
import { ThemeProvider } from 'antdv-style'
import StyledCard from './StyledCard.vue'
</script>

<template>
  <ConfigProvider>
    <ThemeProvider>
      <StyledCard />
    </ThemeProvider>
  </ConfigProvider>
</template>
```

```vue
<!-- StyledCard.vue -->
<script setup lang="ts">
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ token, css }) => ({
  // CSS 对象语法
  container: {
    backgroundColor: token.colorBgLayout,
    borderRadius: token.borderRadiusLG,
    maxWidth: 400,
    width: '100%',
    padding: `${token.paddingLG}px`,
  },
  // CSS 模板字符串语法
  card: css`
    box-shadow: ${token.boxShadow};
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
    cursor: pointer;

    &:hover {
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
}))

const s = useStyles()
</script>

<template>
  <div :class="s.styles.container">
    <div :class="s.styles.card">createStyles 示例</div>
    <div>当前主题：{{ s.theme.appearance }}</div>
  </div>
</template>
```

## Workspace

`antdv-style` 主库继续保留在仓库根目录（`src/`、`dist/`、`package.json`）。
`packages/` 下只拆出两个可选工具包：

| 目录 | 包名 | 用途 |
| --- | --- | --- |
| `packages/vite-plugin-antdv-style` | `vite-plugin-antdv-style` | Vite 自动 label |
| `packages/less2cssinjs` | `@antdv-next/less2cssinjs` | Vue Less 迁移 API 与 `antdv-style-codemod` CLI |

两个工具拥有独立的依赖、导出和构建产物，不再作为主包子路径提供，也不会作为
`antdv-style` 的生产依赖安装。仓库内拆包不代表已经发布到 npm；
各包 README 提供本地打包安装方式。

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm docs:typecheck
pnpm docs:build
pnpm pack:packages
pnpm test:packages
```

`pnpm build:core` 只构建主库。通过 `pnpm --filter vite-plugin-antdv-style build`
或 `pnpm --filter @antdv-next/less2cssinjs build` 分别构建工具包。
压缩包输出至 `artifacts/`；打包操作不会执行发布。
`test:packages` 使用本地 pnpm 缓存，将各压缩包分别安装到临时目录，
验证独立导入、类型、CLI 与主库 SSR。

## 许可证

[MIT](./LICENSE)
