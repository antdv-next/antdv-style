# SSR 集成

antdv-style 提供 `extractStaticStyle` 抽取已注册 Emotion 实例和 antdv-next CSS-in-JS 缓存中的样式。

## 基本流程

1. 为每个请求创建应用和样式实例。
2. 在服务端渲染 Vue 应用。
3. 调用 `extractStaticStyle` 获取 `{ css, tags }`。
4. 把 `tags` 写入 HTML 的 `<head>`。

```ts
import { renderToString } from 'vue/server-renderer'
import { createCache } from '@antdv-next/cssinjs'
import { createSSRApp, h } from 'vue'
import { createInstance, extractStaticStyle } from 'antdv-style'

export async function render() {
  const style = createInstance({ key: 'app', speedy: false })
  const antdCache = createCache()
  const app = createSSRApp({
    render: () => h(style.StyleProvider, { antdCache }, {
      default: () => h(style.ThemeProvider, null, { default: () => h(App) }),
    }),
  })

  try {
    const html = await renderToString(app)
    const styles = extractStaticStyle(style.styleManager, { html, antdCache })

    return { html, head: styles.tags }
  } finally {
    style.dispose()
  }
}
```

## 同时抽取 antdv-next

默认会把 antdv-next 缓存一起抽取。需要把同一个 cache 传给 `StyleProvider` 和 `extractStaticStyle`。并发 SSR 应像上例一样为每个请求调用 `createCache()`，避免请求间共享样式状态。

```vue
<StyleProvider :antd-cache="extractStaticStyle.cache">
  <ThemeProvider><App /></ThemeProvider>
</StyleProvider>
```

`extractStaticStyle.cache` 是便捷的默认 cache，适合单请求示例或非并发环境。也可以设置 `{ includeAntdv: false }` 只抽取 Emotion 样式。

::: warning 当前边界
`extractStaticStyle()` 或 HTML-first 形式会收集进程内已注册的实例。多租户 SSR 应显式传入当前请求的 `styleManager`，并在 `finally` 中调用 `dispose()`。

`StyleProvider.ssrInline` 是兼容透传参数。当前 `@antdv-next/cssinjs@1.0.6`
不会因为设置 `ssrInline: true` 自动向渲染结果插入 `<style>`。仍需显式调用
`extractStaticStyle` 并将返回的 `tags` 写入 HTML，不能用此参数替代样式提取。
:::

## Vite SSR 配置

通过 npm 或 `.tgz` 安装时，需要让 Vite 同时处理 `antdv-style` 及以下依赖。
否则外部化的 `antdv-style` 会通过 Node ESM 加载组件库，可能在
`@v-c/picker` 的 `dayjs/plugin/advancedFormat` 无扩展名导入处失败；
错误发生在 `extractStaticStyle` 执行之前。

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: ['antdv-style', 'antdv-next', /^@v-c\//, '@antdv-next/cssinjs'],
  },
})
```

将 `ssr` 选项合并到项目现有的 Vite 配置中，保留已有插件和其他选项。
仅配置组件库依赖不足以覆盖外部化的 `antdv-style`；源码 `link:` 安装可能掩盖这一差异。
以上配置已用打包产物验证，不代表支持绕过打包器直接通过 Node ESM 加载。

## 关键样式

将渲染后的 HTML 作为 `options.html` 传入时，Emotion 只输出页面实际引用的 class，并保留全局样式和 keyframes：

```ts
extractStaticStyle(style.styleManager, { html, antdCache })
```

兼容 antd-style 的 HTML-first 调用 `extractStaticStyle(html, options)` 也受支持，但它会聚合所有当前注册的 Emotion 实例，因此不适合作为并发请求的首选形式。

## 水合一致性

服务端和客户端必须使用相同的 `key`、`prefixCls`、主题模式和初始外观。`auto` 模式在服务端无法读取浏览器媒体查询，生产项目应从 Cookie 或首屏脚本提供确定的初始外观，避免 FOUC。
