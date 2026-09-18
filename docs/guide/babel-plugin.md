# vite-plugin-antdv-style

`vite-plugin-antdv-style` 是独立的 Vite 调试插件包。它分析 TypeScript/JavaScript 与 Vue SFC 的 `<script>` / `<script setup>`，默认把项目相对路径和变量名注入为 `createStyles` 的 `label`。

## 用途与可选性

这是提供给使用 `antdv-style` 的业务开发者的可选调试工具，不是本仓库内部的测试工具。自动添加的可读类名标签可以帮助辨认样式来自哪个 `createStyles` 变量；不配置插件，也可以正常使用 `createStyles`、主题和其他核心样式能力，或手动指定 `label`。

插件默认仅在 Vite 开发模式处理源码，生产构建不注入标签。它不在浏览器中执行，也不会把样式计算改为纯编译期执行。

包内实际依赖并调用 `babel-plugin-antd-style@1.0.4` 的路径标记 visitor，再把上游的 `__BABEL_FILE_NAME__` 适配为本库的 `label`。业务项目仍通过 Vite 接入，不需要额外配置 Babel。

路径沿用上游规则：忽略 `src`、`index`，每个路径段取第一个点之前的部分，因此 `Button.styles.ts` 对应 `Button`。适配层继续追加变量名；默认导出等没有变量名的调用使用路径标签。不暴露绝对路径，跳过根目录外文件和 `node_modules`。

Vue SFC 拆分、导入别名、作用域绑定检查、已有配置保护和 source map 由本包处理。不会复用上游可能误识别同名局部函数的行为。`NODE_ENV=production` 下上游 visitor 不启用；显式 `devOnly: false` 时，适配层使用相同的路径规则，不修改进程环境变量。

命名沿用上游的 `工具链-plugin-库名` 形式：`babel-plugin-antd-style` 对应这里的 `vite-plugin-antdv-style`，保留 Vite 名称以明确实际接入的工具链。

## 包结构与安装

插件已拆分至同一仓库的 `packages/vite-plugin-antdv-style`，直接从 `vite-plugin-antdv-style` 导入。主包仍在仓库根目录，不再提供插件子路径。

解析和源码改写依赖由插件包独立声明。仅安装 `antdv-style` 不会因为这个插件额外安装工具解析依赖；只有需要自动 label 的项目才需要将插件加入开发依赖。

当前已完成仓库内拆包，但这不代表已向 npm 发布。可在仓库根目录执行 `pnpm install` 和 `pnpm pack:packages`，然后在业务项目安装生成的包：

```bash
pnpm add -D /path/to/antdv-style/artifacts/vite-plugin-antdv-style-1.0.0-rc.1.tgz
```

同仓库开发由 pnpm workspace 管理；插件无需搬到另一个 Git 仓库即可独立构建和打包。

## 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { antdvStyleLabel } from 'vite-plugin-antdv-style'

export default defineConfig({
  plugins: [antdvStyleLabel(), vue()],
})
```

插件应放在 Vue 插件之前。需要保留旧版本“仅变量名、生产也注入”的行为时，显式配置：

```ts
export default defineConfig({
  plugins: [antdvStyleLabel({ devOnly: false, labelFormat: 'variable' }), vue()],
})
```

如果服务端和客户端分别构建，应保持 label 插件的启用条件一致，避免同一份样式生成不同类名。

例如 `src/profile/style.ts` 中的代码：

```ts
import { createStyles } from 'antdv-style'

const useProfileStyles = createStyles(({ css, token }) => ({
  root: css({ color: token.colorPrimary }),
}))
```

等价于：

```ts
const useProfileStyles = createStyles(
  ({ css, token }) => ({
    root: css({ color: token.colorPrimary }),
  }),
  { label: 'profile-style-useProfileStyles' },
)
```

已有 `hashPriority` 等配置会被保留，已有显式 `label` 不会被覆盖。别名导入同样受支持：

第二参数的对象含展开属性（如 `{ ...shared }`）或计算属性时，插件会跳过整个调用，
因为这些属性可能在运行时提供 `label`。此时不会自动注入标签，也不会覆盖共享配置。

```ts
import { createStyles as makeStyles } from 'antdv-style'
const useStyles = makeStyles(() => ({}))
```

## 选项

```ts
antdvStyleLabel({
  include: /src/,
  exclude: /node_modules/,
  importSources: ['antdv-style', '@acme/design-style'],
  labelFormat: 'path', // 默认：目录 + 文件 + 变量名
  devOnly: true, // 默认：仅开发模式
  // root: '/project', // 默认使用 Vite root
})
```

插件只修改从 `importSources` 命名导入的 `createStyles` 调用，并生成高精度 source map。动态属性调用或非对象形式的第二参数不会被猜测改写，此时仍可手动传入 `label`。

直接调用 `transformStyleLabels()` 时，默认仍使用变量名标签；该函数不感知 Vite 模式，
需要目录标签时传入 `{ labelFormat: 'path', root }`。
