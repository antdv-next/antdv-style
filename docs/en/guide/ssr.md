# SSR Integration

`extractStaticStyle` extracts styles from registered Emotion instances and an antdv-next CSS-in-JS cache.

## Request flow

1. Create the application and style instance per request.
2. Render the Vue application on the server.
3. Call `extractStaticStyle` to obtain `{ css, tags }`.
4. Insert `tags` into the HTML head.

```ts
import { createCache } from '@antdv-next/cssinjs'
import { renderToString } from 'vue/server-renderer'
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

Pass the same request-local `antdCache` to `StyleProvider` and `extractStaticStyle` when you also need antdv-next component styles. The static `extractStaticStyle.cache` is convenient for single-request examples or non-concurrent use. Set `{ includeAntdv: false }` to extract only Emotion output.

::: warning Current boundary
The zero-argument and HTML-first forms collect process-level registered instances. Multi-tenant SSR should pass the current request's `styleManager` explicitly and call `dispose()` in `finally`.

`StyleProvider.ssrInline` is a compatibility passthrough. With the current
`@antdv-next/cssinjs@1.0.6`, setting `ssrInline: true` does not automatically insert
`<style>` tags into rendered HTML. Explicitly call `extractStaticStyle` and insert
its `tags` into the HTML; this prop does not replace extraction.
:::

## Vite SSR configuration

When installing from npm or a `.tgz`, Vite must process `antdv-style` together
with the dependencies below. Otherwise the externalized runtime loads the
component library through Node ESM, which can fail on the extensionless
`dayjs/plugin/advancedFormat` import in `@v-c/picker`, before `extractStaticStyle`
runs.

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: ['antdv-style', 'antdv-next', /^@v-c\//, '@antdv-next/cssinjs'],
  },
})
```

Merge the `ssr` option into your existing Vite configuration, retaining its
plugins and other options. Listing only the component-library dependencies does
not cover an externalized `antdv-style`; source `link:` installs can hide this
difference. This configuration is verified against packed artifacts, not raw
Node ESM loading without a bundler.

## Critical styles

Pass rendered HTML as `options.html` to keep only referenced Emotion classes plus global styles and keyframes:

```ts
extractStaticStyle(style.styleManager, { html, antdCache })
```

The antd-style-compatible HTML-first form, `extractStaticStyle(html, options)`, is also supported. Because it aggregates all registered Emotion instances, it is not the preferred form for concurrent requests.

Server and client must agree on the cache key, prefix, theme mode, and initial appearance. Resolve automatic appearance from a cookie or bootstrap script to avoid theme flashes.
