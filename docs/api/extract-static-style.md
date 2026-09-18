# extractStaticStyle

提取 Emotion 与 antdv-next CSS-in-JS 缓存中的服务端样式。

## 签名

```ts
function extractStaticStyle(
  htmlOrEmotion?: string | EmotionInstance | CacheManagerInstance,
  options?: {
    includeAntdv?: boolean
    antdCache?: AntdvStyleCache
    html?: string
  },
): { css: string; tags: string }
```

## 返回值

| 字段 | 描述 |
|---|---|
| `css` | 不含 `<style>` 标签的完整 CSS 文本 |
| `tags` | 可直接插入 HTML `<head>` 的一个或多个 style 标签 |

Emotion 的 `tags` 会对大小写不敏感的 `</style` 序列进行 CSS 转义，防止样式内容
提前结束 HTML 的 style 元素，同时保留其 CSS 含义。`css` 仍是未转义的原始 CSS，
不要自行用 `<style>${css}</style>` 拼接 HTML；请使用 `tags`。
这不是任意不可信 CSS 的消毒器，也不替代业务输入校验。antdv-next 组件样式仍由
`@antdv-next/cssinjs` 自己序列化，此保护仅覆盖本库生成的 Emotion 标签。

## 请求级关键样式抽取

```ts
const instance = createInstance({ key: 'server' })

// 完成 renderToString 后
const result = extractStaticStyle(instance.styleManager, { html })
```

传入渲染后的 `html` 时，只保留 HTML 中引用的 Emotion class，以及必须保留的全局样式、keyframes 等未注册样式。并发 SSR 推荐显式传入当前请求的 `styleManager`。

关键样式抽取支持包含中文等 Unicode 字符的 `label`，并按完整类名匹配，不会把相近类名或其他缓存前缀当成当前类名。
匹配会扫描整段 HTML，并非只解析 `class` 属性；若其他属性或文本中出现完全相同的标识，也会保守地保留对应样式。

为兼容 antd-style，也可以把 HTML 作为第一个参数。该形式会从当前进程已注册的实例中聚合关键样式：

```ts
const result = extractStaticStyle(html, { antdCache })
```

不传实例时同样会聚合当前进程中已注册的 Emotion 实例。请求并发时，优先使用实例级调用，避免聚合其他请求的样式。

## antdv-next 缓存

`extractStaticStyle.cache` 是默认 antdv-next cache，可传给 `StyleProvider`：

```vue
<StyleProvider :antd-cache="extractStaticStyle.cache">
  <App />
</StyleProvider>
```

使用 `{ includeAntdv: false }` 可只返回 Emotion 样式。

SSR 应为每个请求创建独立的 `antdCache`，并把它同时传给 `StyleProvider` 和 `extractStaticStyle`。静态属性 `extractStaticStyle.cache` 适合单请求示例或非并发场景，不应作为并发服务端渲染的共享请求缓存。
