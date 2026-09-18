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
:::

## 关键样式

当前依赖组合在 Vite SSR 中验证通过。若直接用 Node ESM 加载时遇到 `@v-c/picker` 的 `dayjs/plugin/advancedFormat` 无扩展名导入错误，请通过 Vite 打包这些依赖；这不是 `extractStaticStyle` 的报错：

```ts
// vite.config.ts
ssr: { noExternal: ['antdv-next', /^@v-c\//, '@antdv-next/cssinjs'] }
```

将渲染后的 HTML 作为 `options.html` 传入时，Emotion 只输出页面实际引用的 class，并保留全局样式和 keyframes：

```ts
extractStaticStyle(style.styleManager, { html, antdCache })
```

兼容 antd-style 的 HTML-first 调用 `extractStaticStyle(html, options)` 也受支持，但它会聚合所有当前注册的 Emotion 实例，因此不适合作为并发请求的首选形式。

## 水合一致性

服务端和客户端必须使用相同的 `key`、`prefixCls`、主题模式和初始外观。`auto` 模式在服务端无法读取浏览器媒体查询，生产项目应从 Cookie 或首屏脚本提供确定的初始外观，避免 FOUC。
