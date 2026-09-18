# createCacheManager

`reset()` 会立即清空该引擎的样式。重新挂载使用 `createStyles` 的组件时，相同参数的样式也会重新插入；它不会主动重新渲染仍挂载的组件，不应在正在显示的页面中直接调用。

`createCacheManager` 为 Emotion 实例提供可抽取、重置的样式缓存视图。

```ts
const instance = createInstance({ key: 'preview' })
const manager = createCacheManager(instance.styleManager)
```

## 方法

| 方法 | 描述 |
|---|---|
| `getStyles(html?)` | 返回已收集的 CSS 文本；服务端传入 HTML 时仅保留关键样式 |
| `getStyleTags(html?)` | 返回完整 `<style data-emotion>` 标签；支持相同的 HTML 过滤 |
| `reset()` | 清空记录并调用 Emotion `flush()` |
| `emotion` | 被管理的原始 Emotion 实例 |

对同一个 Emotion cache 重复调用会复用同一 manager。

浏览器中的 `createGlobalStyle` 样式表也归所属引擎管理：收集时保留与普通样式表的 DOM 顺序，
`reset()` / 引擎 `flush()` 会一起清空，但不会影响其他实例。组件卸载会注销其全局样式表。
reset 不会停止仍挂载的全局样式 hook；之后主题或其响应式依赖变化时，该 hook 可以重新插入样式。

## 使用场景

- SSR 渲染后提取指定实例；
- 组件预览或测试环境读取生成的 CSS；
- 隔离实例卸载后主动清理样式。

浏览器 speedy 模式下，manager 会从 CSSOM 的 `cssRules` 读取样式；如果浏览器因安全策略拒绝访问规则，则安全地返回空字符串。服务端生成标签时会保留 Emotion cache 上配置的 CSP nonce。

普通应用无需直接管理它，优先使用 [`extractStaticStyle`](/api/extract-static-style)。
