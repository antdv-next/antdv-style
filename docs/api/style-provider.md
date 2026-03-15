# StyleProvider

为组件子树覆盖 Emotion 样式引擎。用于 SSR 缓存隔离、Shadow DOM 挂载或作用域样式注入。

## Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|---------|-------------|
| `cache` | `EmotionInstance` | — | 直接传入预创建的 Emotion 实例 |
| `cacheKey` | `string` | — | 使用此缓存键创建新的 Emotion 实例 |
| `container` | `HTMLElement` | — | 样式注入的目标 DOM 节点（与 `cacheKey` 配合使用） |

传入 `cache` **或** `cacheKey` 之一即可。若两者均未传入，`StyleProvider` 将直接渲染插槽内容，不改变样式引擎。

## 示例

```vue
<!-- SSR：将样式注入到 shadow root -->
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

## 注意事项

- `StyleProvider` 只影响 Emotion 引擎 — 它不提供主题 Token。如果需要访问 Token，请同时使用 `<ThemeProvider>` 包裹。
- 用于 SSR 时，请传入与服务端缓存管理器相同的 `EmotionInstance`，以确保提取的样式一致。
- 多个 `StyleProvider` 实例可以独立嵌套 — 每个作用域相互隔离。
