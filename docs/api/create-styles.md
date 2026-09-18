# createStyles

<CreateStylesDemo />

<CreateStylesVariantsDemo variant="props" />

<RuntimeCapabilitiesDemo variant="label" />

<ResponsiveDemo />

<ResponsiveStylesDemo />

创建具有 Token 访问能力的作用域组件样式。

## 签名

```typescript
function createStyles<P = void, R extends StyleFactoryInput = StyleInput>(
  factory: R | ((utils: CreateStylesUtils, props: P) => R),
  options?: CreateStylesOptions,
): (propsOrGetter?: P | (() => P)) => CreateStylesReturn<StyleResult<R>>
```

`factory` 可以返回 class 映射、现有 class 字符串，或直接传入静态样式对象。依赖响应式 props 时使用 getter：`useStyles(() => props)`。

## CreateStylesUtils

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | `Theme` | antdv-next Token、自定义 Token 与主题状态 |
| `css` | `(...styles) => string` | 生成单个 Emotion class |
| `cx` | `(...classNames) => string` | 合并普通与 Emotion class |
| `responsive` | `ResponsiveUtil` | 可调用的响应式工具，同时暴露 `xs` 到 `desktop` 查询 |
| `prefixCls` | `string` | 当前组件前缀 |
| `iconPrefixCls` | `string` | 当前图标前缀 |
| `appearance` | `Appearance` | 当前外观 |
| `isDarkMode` | `boolean` | 当前是否暗色 |
| `stylish` | `FullStylish` | 内置与自定义 Stylish 集合 |
| `cssVar` | `Record<string, string>` | Token 对应 CSS 变量代理 |

## Options

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | — | 为生成的 class 添加可读标签；可由 [Vite 插件](/guide/babel-plugin) 自动注入 |
| `hashPriority` | `'high' \| 'low'` | 实例配置或 `'high'` | `low` 使用 `:where()` 降低选择器优先级 |

## 返回值

```typescript
interface CreateStylesReturn {
  styles: Record<string, string>    // Class name 映射表
  cx: (...classNames: ClassNamesArg[]) => string    // 合并 class name
  theme: Theme                       // 完整的主题对象
  prefixCls: string                  // 组件 class 前缀
  iconPrefixCls: string              // 图标 class 前缀
}
```

返回对象由 Vue `reactive()` 包装。主题、外观和 props getter 的依赖变化时，`styles` 会重新计算；循环引用、BigInt 与函数值 props 不会被 JSON 序列化。

### 响应式输入与缓存

请把样式工厂视为主题与 props 的纯函数。需要响应式更新的业务数据应由
`useStyles(() => ({ ... }))` 的 getter 显式传入，再从工厂的第二参数读取。
不要依赖工厂闭包直接读取任意 `ref`、`reactive` 或 store 来使缓存失效；
这不属于支持的响应式契约。主题数据通过 `token` 等工厂工具参数获取。

工厂结果可能被缓存复用，因此不要在工厂中执行副作用，也不要依赖调用次数。

输入中包含无法安全生成缓存键的非普通对象（例如 class 实例）时，会跳过共享结果
缓存，而不是仅按对象身份复用旧样式。通过 props getter 显式传入后，工厂读取的
响应式字段仍由 Vue 追踪。普通对象输入继续使用缓存；这不意味着非响应式字段
或闭包里的任意外部状态会自动触发更新。

::: warning
不要直接从返回值中解构 `styles`，这会丢失 Vue 响应性。使用 `s.styles.xxx`，或先调用 `toRefs(s)`。
:::

## Props 示例

```vue
<script setup lang="ts">
import { createStyles } from 'antdv-style'

const props = defineProps<{ selected?: boolean }>()
const useStyles = createStyles<{ selected: boolean }>(
  ({ css, token }, value) => ({
    root: css({
      color: value.selected ? token.colorPrimary : token.colorText,
    }),
  }),
)
const s = useStyles(() => ({ selected: Boolean(props.selected) }))
</script>
```

## 示例

详细用法请参阅[指南：createStyles](/guide/create-styles)。
