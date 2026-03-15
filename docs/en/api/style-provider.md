# StyleProvider

Override the Emotion style engine for a component subtree. Used for SSR cache isolation, Shadow DOM mounting, or scoped style injection.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cache` | `EmotionInstance` | — | Pass a pre-created Emotion instance directly |
| `cacheKey` | `string` | — | Create a new Emotion instance with this cache key |
| `container` | `HTMLElement` | — | DOM node where styles are injected (used with `cacheKey`) |

Provide either `cache` **or** `cacheKey`. If neither is supplied `StyleProvider` renders its slot without changing the engine.

## Example

```vue
<!-- SSR: inject styles into a shadow root -->
<template>
  <StyleProvider cache-key="shadow-scope" :container="shadowRoot">
    <MyApp />
  </StyleProvider>
</template>

<script setup>
import { StyleProvider } from 'antdv-style'
import { ref, onMounted } from 'vue'

const shadowRoot = ref(null)

onMounted(() => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  shadowRoot.value = host.attachShadow({ mode: 'open' })
})
</script>
```

## Notes

- `StyleProvider` only affects the Emotion engine — it does not provide theme tokens. Wrap with `<ThemeProvider>` as well if token access is needed.
- When used for SSR, pass the same `EmotionInstance` that your server cache manager uses so extracted styles are consistent.
- Multiple `StyleProvider` instances can be nested independently — each scope is isolated.
