# StyleProvider

<StyleEngineDemo />

Configure the Emotion and antdv-next CSS-in-JS engines for a component subtree. Use it for SSR isolation, CSP, Shadow DOM, micro-frontends, and insertion ordering.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cache` | `EmotionInstance \| AntdvStyleCache` | — | Compatibility entry; the object shape selects the cache type |
| `emotionCache` | `EmotionInstance` | — | Explicit pre-created Emotion instance |
| `antdCache` | `AntdvStyleCache` | — | Cache passed to `@antdv-next/cssinjs` |
| `cacheKey` | `string` | parent key | Key used when creating an Emotion instance |
| `prefix` | `string` | `cacheKey` | Higher-priority compatibility alias for `cacheKey` |
| `container` | `Node` | parent container | Emotion target; Element/ShadowRoot is also passed to antdv-next |
| `speedy` | `boolean` | parent setting | Enable CSSOM `insertRule` mode |
| `nonce` | `string` | — | CSP nonce for Emotion style tags |
| `insertionPoint` | `HTMLElement` | — | Anchor after which the first Emotion tag is inserted |
| `stylisPlugins` | `StylisPlugin[]` | — | Emotion serialization plugins |
| `getStyleManager` | `(engine) => void` | — | Receive the effective Emotion instance |
| `hashPriority` | `'high' \| 'low'` | inherited; `'low'` without parent configuration | antdv-next selector priority |
| `ssrInline` | `boolean` | — | Compatibility passthrough; the current dependency does not emit inline styles automatically |
| `transformers` | `Transformer[]` | — | antdv-next style transformers |
| `linters` | `Linter[]` | — | antdv-next style linters |
| `layer` | `boolean` | — | Enable antdv-next CSS layers |
| `autoPrefix` | `boolean` | — | antdv-next auto-prefix setting |

With no configuration the component passes its slot through. Any Emotion option creates or selects an engine. antdv-next-only options retain the parent Emotion engine.

`hashPriority` controls hash selectors in antdv-next component styles: `low` uses `:where(...)` to reduce specificity. Set `<StyleProvider hash-priority="high">` explicitly for high priority. When omitted, the value is inherited from the parent, or defaults to `low` without parent configuration.

## Example

```vue
<!-- ThemeProvider descendants use the same scoped engine -->
<template>
  <div ref="host" />
  <Teleport v-if="shadowRoot" :to="shadowRoot">
    <StyleProvider cache-key="shadow-scope" :container="shadowRoot">
      <ThemeProvider prefix-cls="shadow-demo">
        <MyApp />
      </ThemeProvider>
    </StyleProvider>
  </Teleport>
</template>

<script setup lang="ts">
import { StyleProvider, ThemeProvider } from 'antdv-style'
import { shallowRef, onMounted } from 'vue'

const host = shallowRef<HTMLDivElement | null>(null)
const shadowRoot = shallowRef<ShadowRoot | null>(null)

onMounted(() => {
  shadowRoot.value = host.value!.attachShadow({ mode: 'open' })
})
</script>
```

## Notes

- `StyleProvider` does not provide theme tokens. Prefer `<StyleProvider><ThemeProvider>...</ThemeProvider></StyleProvider>` so themed styles inherit the scoped engine.
- When used for SSR, pass the same `EmotionInstance` that your server cache manager uses so extracted styles are consistent.
- The current `@antdv-next/cssinjs@1.0.6` accepts `ssrInline`, but setting it to `true` does not automatically insert `<style>` tags. Explicitly call `extractStaticStyle` with the same request-local `antdCache` and insert its `tags` into the HTML. See [SSR integration](../guide/ssr).
- The `StyleProvider` returned by `createInstance()` retains that instance's Emotion engine when only `antdCache` is configured.
- The container, cache and other engine creation options are selected at mount time. Use `v-if` to wait for an asynchronous container; remount the provider to change engine options.
- The current `@antdv-next/cssinjs` component-style deduplication can collide across containers sharing a prefix. Give ShadowRoot components a unique `prefixCls`, as above, and configure their popup container too. Emotion custom styles are not affected.
- Unmounting flushes Emotion engines created by this provider; supplied engines remain caller-owned. `insertionPoint` controls Emotion tags only, not antdv-next tags.
- Multiple `StyleProvider` instances can be nested independently — each scope is isolated.
