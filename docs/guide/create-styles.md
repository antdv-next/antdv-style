# createStyles

用于创建具有 Token 访问能力的作用域组件样式的核心 API。

## 基础用法

```typescript
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ token, css }) => ({
  // CSS 对象语法
  container: {
    backgroundColor: token.colorBgLayout,
    borderRadius: token.borderRadiusLG,
  },
  // CSS 模板字符串语法
  card: css`
    padding: ${token.padding}px;
    background: ${token.colorBgContainer};
  `,
}))
```

## 使用返回值

```typescript
// 方式 1：不解构（推荐）
const s = useStyles()
// template: s.styles.container

// 方式 2：用 toRefs 解构（需要响应式解构时）
import { toRefs } from 'vue'
const { styles } = toRefs(useStyles())
// template: styles.container（ref 自动解包）

// 错误：直接解构会丢失响应性
const { styles } = useStyles()  // styles 是快照，不会更新
```

::: tip 为什么不能直接解构？
`useStyles()` 返回 `reactive()` 对象。Vue 的 `reactive()` 解构后会变成普通值，丢失响应式追踪。这是 JavaScript 语言限制，不是 Vue 的 bug。用 `toRefs()` 可以将每个属性转为独立的 `Ref`，解构后仍保持响应式。
:::

## 传入 Props

通过 getter 函数传入动态 Props：

```typescript
interface StyleProps {
  active: boolean
}

const useStyles = createStyles(({ token, css }, props: StyleProps) => ({
  button: css`
    background: ${props.active ? token.colorPrimary : token.colorBgContainer};
  `,
}))

// 在 setup 中：
const s = useStyles(() => ({ active: isActive.value }))
```

## 工厂函数工具参数

工厂函数会接收以下工具参数：

| 工具 | 类型 | 描述 |
|------|------|-------------|
| `token` | `Theme` | 合并后的 antd Token + 自定义 Token |
| `css` | `(...args) => string` | Emotion css，返回 class name |
| `cx` | `(...args) => string` | 合并 class name |
| `cssVar` | `Record<string, string>` | CSS 变量引用 |
| `responsive` | `ResponsiveUtil` | 媒体查询字符串及可调用工具 |
| `stylish` | `Record<string, string>` | Stylish 预设 |
| `appearance` | `Appearance` | 当前主题外观 |
| `isDarkMode` | `boolean` | 是否处于暗色模式 |
| `prefixCls` | `string` | 组件 class 前缀 |
| `iconPrefixCls` | `string` | 图标 class 前缀 |

## 静态样式对象

也可以直接传入普通对象，不使用工厂函数：

```typescript
const useStyles = createStyles({
  container: { padding: '16px' },
})
```

## 重要：`css` 模板标签 vs 函数调用

::: danger 关键区别
当需要将 **class name 用作 CSS 选择器** 进行插值时，必须使用 `css()` **函数调用**，而不能使用 `` css`...` `` 模板标签。
:::

### 原因

antdv-style 中的 `css` 返回的是一个 **class name 字符串**（例如 `antdv-css-abc123`）。Emotion 的模板标签会将字符串插值视为"已注册样式"并展开为其 CSS 内容，而不是保留为字面量选择器字符串。

```typescript
const useStyles = createStyles(({ css }) => {
  const child = css`background: red; width: 100px; height: 100px;`

  return {
    // 错误 — 模板标签会将 ${child} 展开为其 CSS 内容
    parent: css`
      &:hover .${child} { background: blue; }
    `,

    // 正确 — 函数调用将 ${child} 视为普通字符串
    parent: css(`
      &:hover .${child} { background: blue; }
    `),

    child,
  }
})
```

生成的 CSS 对比：

```css
/* 错误（模板标签）：选择器被破坏 */
.parent { &:hover .background:red;width:100px;height:100px; { background:blue; } }

/* 正确（函数调用）：选择器被正确保留 */
.parent:hover .antdv-css-abc123 { background: blue; }
```

### 使用规则

| 场景 | 使用方式 |
|----------|-----|
| Token 插值：`${token.colorPrimary}` | `` css`...` ``（模板标签）— 可以 |
| Props 插值：`${props.active ? 'red' : 'blue'}` | `` css`...` ``（模板标签）— 可以 |
| Class name 作为选择器：`.${child}` | `css(\`...\`)`（函数调用）— 必须 |

### `cx` 的用法

`cx` 用于 **合并多个 class name**，类似 `classnames` 库：

```typescript
// 合并多个 class
<div :class="s.cx(s.styles.card, s.styles.active)" />

// 条件性 class
<div :class="s.cx(s.styles.base, isActive && s.styles.highlight)" />
```

在 antdv-style 中，`cx(css\`...\`)` 是多余的 — `css` 本身就返回 class name 字符串。
