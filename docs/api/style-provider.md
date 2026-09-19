# StyleProvider

<StyleEngineDemo />

为组件子树配置 Emotion 与 antdv-next CSS-in-JS 引擎。常用于 SSR 缓存隔离、CSP、Shadow DOM、微前端和样式插入顺序控制。

## Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|---------|-------------|
| `cache` | `EmotionInstance \| AntdvStyleCache` | — | 兼容入口；根据对象形状识别 Emotion 或 antdv-next cache |
| `emotionCache` | `EmotionInstance` | — | 明确传入预创建的 Emotion 实例 |
| `antdCache` | `AntdvStyleCache` | — | 传给 `@antdv-next/cssinjs` 的 cache |
| `cacheKey` | `string` | 父引擎 key | 创建 Emotion 实例时使用的 key |
| `prefix` | `string` | `cacheKey` | `cacheKey` 的兼容别名，优先级更高 |
| `container` | `Node` | 父引擎容器 | Emotion 样式注入目标；Element/ShadowRoot 也传给 antdv-next |
| `speedy` | `boolean` | 父引擎设置 | 是否使用 CSSOM `insertRule` |
| `nonce` | `string` | — | Emotion style 标签的 CSP nonce |
| `insertionPoint` | `HTMLElement` | — | Emotion 首个 style 标签的插入锚点 |
| `stylisPlugins` | `StylisPlugin[]` | — | Emotion 序列化插件 |
| `getStyleManager` | `(engine) => void` | — | 获取当前作用域实际使用的 Emotion 实例 |
| `hashPriority` | `'high' \| 'low'` | 继承父级；未配置时为 `'low'` | antdv-next 选择器优先级 |
| `ssrInline` | `boolean` | — | 兼容透传参数；当前依赖不会自动输出内联样式 |
| `transformers` | `Transformer[]` | — | antdv-next 样式转换器 |
| `linters` | `Linter[]` | — | antdv-next 样式检查器 |
| `layer` | `boolean` | — | 启用 antdv-next CSS layer |
| `autoPrefix` | `boolean` | — | antdv-next 自动前缀设置 |

完全不传配置时组件直接透传插槽。只要设置任一 Emotion 配置，就会创建或选择对应引擎；只设置 antdv-next 配置时会保留父级 Emotion 引擎。

`hashPriority` 控制 antdv-next 组件样式的哈希选择器：`low` 使用 `:where(...)` 降低权重。需要高优先级时，显式设置 `<StyleProvider hash-priority="high">`；省略时继承父级配置，无父级配置时为 `low`。

## 示例

```vue
<!-- 将 ThemeProvider 放在 StyleProvider 内，主题样式会使用同一个引擎 -->
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

## 注意事项

- `StyleProvider` 不提供主题 Token；推荐使用 `<StyleProvider><ThemeProvider>...</ThemeProvider></StyleProvider>`，使主题生成的样式继承该引擎。
- 用于 SSR 时，请传入与服务端缓存管理器相同的 `EmotionInstance`，以确保提取的样式一致。
- 当前 `@antdv-next/cssinjs@1.0.6` 只接收 `ssrInline`，不会因其为 `true` 自动插入 `<style>`。请使用相同的请求级 `antdCache` 显式调用 `extractStaticStyle` 并将 `tags` 写入 HTML，见 [SSR 集成](../guide/ssr)。
- `createInstance()` 返回的 `StyleProvider` 在只配置 `antdCache` 时，默认保留该实例的 Emotion 引擎。
- `container`、缓存和其他引擎创建选项在挂载时确定。异步创建容器时，用 `v-if` 等待容器就绪；变更引擎配置需要重新挂载 Provider。
- 当前 `@antdv-next/cssinjs` 的同前缀组件样式去重可能跨容器冲突。ShadowRoot 内的 antdv-next 组件请使用独立 `prefixCls`（如示例），并为弹层配置相同的挂载目标。此限制不影响 Emotion 自定义样式。
- Provider 卸载会清理自己创建的 Emotion 引擎及样式；外部传入的引擎仍由调用方管理。`insertionPoint` 只控制 Emotion 标签，不控制 antdv-next 标签。
- 多个 `StyleProvider` 实例可以独立嵌套 — 每个作用域相互隔离。
