# extractStaticStyle

Extract Emotion and antdv-next CSS-in-JS output for server rendering.

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

`css` contains raw CSS; `tags` contains complete style tags ready for the HTML head.

Emotion tags CSS-escape case-insensitive `</style` sequences so style content
cannot prematurely close its HTML element, while preserving CSS meaning. The
`css` field remains raw: use `tags`, not a manually assembled
`<style>${css}</style>` string, when embedding into HTML. This is not a sanitizer
for arbitrary untrusted CSS or a replacement for application input validation.
Component styles are still serialized by `@antdv-next/cssinjs`; this protection
only covers this library's Emotion tags.

```ts
const instance = createInstance({ key: 'server' })
const result = extractStaticStyle(instance.styleManager, { html })
```

When rendered `html` is provided, Emotion output is reduced to referenced classes plus unregistered global or linked styles such as keyframes. Concurrent SSR should pass the request-local `styleManager` explicitly.

Critical extraction supports Unicode labels, including Chinese characters. Matching uses complete class identifiers so similar class names or other cache prefixes do not count as references.
Matching scans the whole HTML string, not only `class` attributes. An identical identifier in another attribute or text conservatively retains the corresponding rule too.

For antd-style compatibility, rendered HTML can also be the first argument. This form aggregates critical styles from currently registered instances:

```ts
const result = extractStaticStyle(html, { antdCache })
```

The zero-argument form also aggregates process-level registered instances. Prefer the instance form for concurrent requests so unrelated request styles are not included.

Pass `extractStaticStyle.cache` to `StyleProvider.antdCache` to collect antdv-next component styles, or set `includeAntdv: false` for Emotion only.

For SSR, create an independent `antdCache` per request and pass it to both `StyleProvider` and `extractStaticStyle`. The static `extractStaticStyle.cache` is intended for single-request examples or non-concurrent use, not as shared request state on a concurrent server.
