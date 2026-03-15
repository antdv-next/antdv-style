# createStyles

Create scoped component styles with token access.

## Signature

```typescript
function createStyles<P = void>(
  factory: ((utils: CreateStylesUtils, props: P) => Record<string, CSSInterpolation | string>) | Record<string, CSSInterpolation | string>,
  options?: { label?: string; hashPriority?: 'high' | 'low' }
): (propsOrGetter?: P | (() => P)) => CreateStylesReturn
```

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

::: warning
Don't destructure `styles` from the return — it loses Vue reactivity. Use `s.styles.xxx` instead.
:::

## Examples

See [Guide: createStyles](/en/guide/create-styles) for detailed usage.
