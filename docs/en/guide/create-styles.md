# createStyles

The core API for creating scoped component styles with token access.

## Basic Usage

```typescript
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ token, css }) => ({
  // CSS object syntax
  container: {
    backgroundColor: token.colorBgLayout,
    borderRadius: token.borderRadiusLG,
  },
  // CSS template literal syntax
  card: css`
    padding: ${token.padding}px;
    background: ${token.colorBgContainer};
  `,
}))
```

## Using the Return Value

```typescript
// Option 1: No destructuring (recommended)
const s = useStyles()
// template: s.styles.container

// Option 2: Destructure with toRefs (when you need reactive destructuring)
import { toRefs } from 'vue'
const { styles } = toRefs(useStyles())
// template: styles.container (ref auto-unwrapped)

// Wrong: Direct destructuring loses reactivity
const { styles } = useStyles()  // styles is a snapshot, won't update
```

::: tip Why can't I destructure directly?
`useStyles()` returns a `reactive()` object. Vue's `reactive()` loses reactivity tracking when destructured — this is a JavaScript language limitation, not a Vue bug. Use `toRefs()` to convert each property to an individual `Ref` that stays reactive after destructuring.
:::

## With Props

Pass dynamic props via a getter function:

```typescript
interface StyleProps {
  active: boolean
}

const useStyles = createStyles(({ token, css }, props: StyleProps) => ({
  button: css`
    background: ${props.active ? token.colorPrimary : token.colorBgContainer};
  `,
}))

// In setup:
const s = useStyles(() => ({ active: isActive.value }))
```

## Factory Utils

The factory function receives these utilities:

| Util | Type | Description |
|------|------|-------------|
| `token` | `Theme` | Merged antd tokens + custom tokens |
| `css` | `(...args) => string` | Emotion css, returns class name |
| `cx` | `(...args) => string` | Merge class names |
| `cssVar` | `Record<string, string>` | CSS variable references |
| `responsive` | `ResponsiveUtil` | Media query strings + callable |
| `stylish` | `Record<string, string>` | Stylish presets |
| `appearance` | `Appearance` | Current theme appearance |
| `isDarkMode` | `boolean` | Whether dark mode is active |
| `prefixCls` | `string` | Component class prefix |
| `iconPrefixCls` | `string` | Icon class prefix |

## Static Style Object

You can also pass a plain object without a function:

```typescript
const useStyles = createStyles({
  container: { padding: '16px' },
})
```

## Important: `css` Tagged Template vs Function Call

::: danger Key Difference
When interpolating a **class name as a CSS selector**, you MUST use `css()` function call, NOT `` css`...` `` tagged template.
:::

### Why?

`css` in antdv-style returns a **class name string** (e.g. `acss-abc123`). Emotion's tagged template treats string interpolations as "registered styles" and expands them into their CSS content, instead of keeping them as literal selector strings.

```typescript
const useStyles = createStyles(({ css }) => {
  const child = css`background: red; width: 100px; height: 100px;`

  return {
    // WRONG — tagged template expands ${child} into its CSS content
    parent: css`
      &:hover .${child} { background: blue; }
    `,

    // CORRECT — function call treats ${child} as a plain string
    parent: css(`
      &:hover .${child} { background: blue; }
    `),

    child,
  }
})
```

Generated CSS comparison:

```css
/* WRONG (tagged template): selector is destroyed */
.parent { &:hover .background:red;width:100px;height:100px; { background:blue; } }

/* CORRECT (function call): selector is preserved */
.parent:hover .acss-abc123 { background: blue; }
```

### Rule of Thumb

| Scenario | Use |
|----------|-----|
| Token interpolation: `${token.colorPrimary}` | `` css`...` `` (tagged template) — fine |
| Props interpolation: `${props.active ? 'red' : 'blue'}` | `` css`...` `` (tagged template) — fine |
| Class name as selector: `.${child}` | `css(\`...\`)` (function call) — required |

### `cx` Usage

`cx` is for **merging multiple class names**, like the `classnames` library:

```typescript
// Merge multiple classes
<div :class="s.cx(s.styles.card, s.styles.active)" />

// Conditional classes
<div :class="s.cx(s.styles.base, isActive && s.styles.highlight)" />
```

`cx(css\`...\`)` is redundant in antdv-style — `css` already returns a class name string.
