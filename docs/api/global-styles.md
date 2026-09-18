# createGlobalStyle

<RuntimeCapabilitiesDemo variant="global" />

注入响应式全局 CSS，当主题变化时自动更新。

## 签名

```typescript
function createGlobalStyle(
  factory: (utils: CreateStylesUtils) => Record<string, unknown> | string | void
): () => void
```

`createGlobalStyle` 返回一个 composable（`useGlobalStyle`）。在组件的 `setup` 中调用该 composable 以激活样式。样式会注入当前 Emotion 引擎的容器（默认 `<head>`），并遵循其 nonce、insertion point 与 Stylis 配置；组件卸载时会移除对应样式。

## 工厂函数参数

`factory` 接收与 `createStyles` 相同的 `utils` 对象：

| 属性 | 类型 | 描述 |
|----------|------|-------------|
| `token` | `Theme` | 完整的设计 Token 对象 |
| `css` | `(styles: object) => string` | Emotion css 辅助函数 |
| `cx` | `(...args) => string` | 合并 class name |
| `prefixCls` | `string` | 组件 class 前缀 |
| `iconPrefixCls` | `string` | 图标 class 前缀 |
| `isDarkMode` | `boolean` | 是否处于暗色模式 |
| `appearance` | `Appearance` | 当前外观（内置 `'light'` / `'dark'`，也支持自定义值） |
| `responsive` | `ResponsiveUtil` | 基于当前主题断点的响应式媒体查询辅助工具 |
| `stylish` | `object` | 共享的 Stylish 预设 |
| `cssVar` | `Record<string, string>` | CSS 变量映射 |

工厂函数应返回选择器到样式的映射（`Record<string, StyleObject>`）或原始 CSS 字符串。

## 示例

```vue
<script setup>
import { createGlobalStyle } from 'antdv-style'

const useGlobalStyle = createGlobalStyle(({ token, isDarkMode }) => ({
  body: {
    backgroundColor: isDarkMode ? token.colorBgContainer : '#fff',
    color: token.colorText,
  },
  'a, a:visited': {
    color: token.colorPrimary,
  },
}))

useGlobalStyle()
</script>
```

## 注意事项

- 必须在 `<ThemeProvider>` 的后代组件中调用。
- 该 composable 会在主题变化时响应式地重新注入样式。
- 在 SSR 环境中，样式通过 Emotion 缓存注入，以支持服务端样式提取。
