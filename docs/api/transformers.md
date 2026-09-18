# 样式转换器

## px2remTransformer

将 CSS 字符串中的像素值转换为 rem：

```ts
const transform = px2remTransformer({
  rootValue: 16,
  precision: 5,
  minPixelValue: 1,
})

transform('padding: 16px; border: 1px solid;')
// padding: 1rem; border: 0.0625rem solid;
```

| 选项 | 默认值 | 描述 |
|---|---:|---|
| `rootValue` | `16` | 根字号 |
| `precision` | `5` | 小数精度 |
| `minPixelValue` | `0` | 绝对值小于该阈值的 px 不转换 |
| `mediaQuery` | 见下文 | 是否转换查询参数中的 px |

该工具转换已经序列化的 CSS 字符串，不会自动接入 Emotion。可在自定义构建或导出流程中使用。

转换基于 CSS 语法，只处理声明值和 `@media`、`@supports`、`@container` 参数中的
px 长度，包括负值与原生数学函数。URL、引号字符串、注释、选择器和属性名不改写，
例如 `url("/icon-16px.png")` 与 `content: "16px"` 保持不变。
完整样式表和声明片段均可输入；CSS 解析失败时原样返回，不输出部分转换结果。

返回值同时具备上游的对象 `visit` 接口，可以直接放入 `StyleProvider.transformers`。
对象访问器复用 `@antdv-next/cssinjs` 的正式实现，并保留 `lineHeight` 等无单位数字属性，
以兼容原生 ESM SSR 的依赖加载方式：

```ts
import { px2remTransformer } from 'antdv-style'

const transformers = [px2remTransformer({ rootValue: 16, mediaQuery: true })]
// <StyleProvider :transformers="transformers">...</StyleProvider>
```

此转换只作用于 antdv-next 的 CSS-in-JS 样式，不会转换 Emotion 自定义样式。
它处理注册的样式对象中的数字/px 声明，不会改写组件库另一条流水线生成的 Token CSS 变量定义；
例如字体来自 `var(--ant-font-size)` 时，仅配置此访问器不代表该变量的 px 值也已转换。

两种入口的兼容边界：对象访问器遵循上游默认值，`mediaQuery` 默认 `false`，
保留 1px 边框，`minPixelValue` 不作用于它。字符串调用保留本库原有行为，
默认转换查询参数；设置 `mediaQuery: false` 可保留这些参数，`minPixelValue` 只作用于字符串入口。

## legacyLogicalPropertiesTransformer

从 `@antdv-next/cssinjs` 重新导出，用于把逻辑属性转换为兼容旧浏览器的物理属性。它属于 antdv-next `StyleProvider` 的 transformer：

```vue
<StyleProvider :transformers="[legacyLogicalPropertiesTransformer]">
  <App />
</StyleProvider>
```
