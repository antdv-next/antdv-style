# createStyles

<CreateStylesDemo />

<CreateStylesVariantsDemo variant="props" />

<RuntimeCapabilitiesDemo variant="label" />

<ResponsiveDemo />

<ResponsiveStylesDemo />

Create scoped component styles with token access.

## Signature

```typescript
function createStyles<P = void, R extends StyleFactoryInput = StyleInput>(
  factory: R | ((utils: CreateStylesUtils, props: P) => R),
  options?: CreateStylesOptions,
): (propsOrGetter?: P | (() => P)) => CreateStylesReturn<StyleResult<R>>
```

The factory may return a class map, a single existing class string, or be replaced by a static style object. Pass a getter, `useStyles(() => props)`, when styles depend on reactive props.

## CreateStylesUtils

| Field | Type | Description |
|------|------|-------------|
| `token` | `Theme` | antdv-next tokens, custom tokens, and theme state |
| `css` | `(...styles) => string` | Generate one Emotion class |
| `cx` | `(...classNames) => string` | Merge plain and Emotion classes |
| `responsive` | `ResponsiveUtil` | Callable responsive utility plus `xs` through `desktop` queries |
| `prefixCls` | `string` | Current component prefix |
| `iconPrefixCls` | `string` | Current icon prefix |
| `appearance` | `Appearance` | Current appearance |
| `isDarkMode` | `boolean` | Whether the current appearance is dark |
| `stylish` | `FullStylish` | Built-in and custom stylish presets |
| `cssVar` | `Record<string, string>` | Token CSS-variable proxy |

## Options

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Add readable class labels; the [Vite plugin](/en/guide/babel-plugin) can inject it |
| `hashPriority` | `'high' \| 'low'` | instance value or `'high'` | `low` wraps selectors in `:where()` |

## Return Value

```typescript
interface CreateStylesReturn {
  styles: Record<string, string>    // Class name map
  cx: (...classNames: ClassNamesArg[]) => string    // Merge class names
  theme: Theme                       // Full theme object
  prefixCls: string                  // Component class prefix
  iconPrefixCls: string              // Icon class prefix
}
```

Vue wraps the result in `reactive()`. Styles recompute when theme, appearance, or props-getter dependencies change; circular references, BigInt, and function-valued props are not JSON-serialized.

### Reactive Inputs and Caching

Treat the style factory as a pure function of its theme and props. Pass reactive
application data explicitly through `useStyles(() => ({ ... }))` and read it from
the factory's second argument. Reading arbitrary refs, reactive objects, or stores
directly from a factory closure is not a supported cache-invalidation contract.
Read theme data through factory utilities such as `token`.

Factory results may be reused from cache. Do not perform side effects inside the
factory or depend on its invocation count.

Inputs containing non-plain objects whose state cannot be safely represented by
a cache key, such as class instances, bypass the shared result cache rather than
reusing styles by object identity. Pass these inputs explicitly through the props
getter; Vue still tracks reactive fields read by the factory. Plain-object inputs
continue to use caching. Non-reactive fields and arbitrary external closure state
do not automatically trigger updates.

::: warning
Do not directly destructure `styles`; that loses Vue reactivity. Use `s.styles.xxx` or call `toRefs(s)` first.
:::

## Props Example

```vue
<script setup lang="ts">
import { createStyles } from 'antdv-style'

const props = defineProps<{ selected?: boolean }>()
const useStyles = createStyles<{ selected: boolean }>(
  ({ css, token }, value) => ({
    root: css({ color: value.selected ? token.colorPrimary : token.colorText }),
  }),
)
const s = useStyles(() => ({ selected: Boolean(props.selected) }))
</script>
```

## Examples

See [Guide: createStyles](/en/guide/create-styles) for detailed usage.
